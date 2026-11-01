import 'dart:async';
import 'dart:convert';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// WebView-based MediaPipe extractor - sử dụng bản web đã hoạt động
class WebViewMediaPipeExtractor {
  static const int SEQUENCE_LENGTH = 64;
  static const int FEATURE_DIM = 327;

  WebViewController? _controller;
  bool _isInitialized = false;

  final List<Uint8List> _frameBuffer = [];
  final Completer<Map<String, dynamic>> _extractionCompleter = Completer();

  // Debug state
  int frameCount = 0;
  String? lastError;

  Future<void> initialize() async {
    if (_isInitialized) return;

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: _handleMessage,
      )
      ..loadRequest(Uri.parse('https://signlight.id.vn/luyen-ai'));

    // Wait for web page ready
    await Future.delayed(const Duration(seconds: 3));
    _isInitialized = true;
  }

  void _handleMessage(JavaScriptMessage message) {
    try {
      final data = jsonDecode(message.message);

      if (data['type'] == 'extraction_complete') {
        final features = (data['features'] as List).cast<double>();
        final quality = data['quality'] as Map<String, dynamic>;

        if (!_extractionCompleter.isCompleted) {
          _extractionCompleter.complete({
            'features': features,
            'frameCount': quality['frameCount'] ?? 0,
            'hasHands': quality['hasHands'] ?? false,
            'hasPose': quality['hasPose'] ?? false,
          });
        }
      } else if (data['type'] == 'error') {
        lastError = data['message'];
        if (!_extractionCompleter.isCompleted) {
          _extractionCompleter.completeError(Exception(data['message']));
        }
      } else if (data['type'] == 'frame_processed') {
        frameCount = data['frameCount'] ?? 0;
      }
    } catch (e) {
      lastError = e.toString();
      if (!_extractionCompleter.isCompleted) {
        _extractionCompleter.completeError(e);
      }
    }
  }

  void start() {
    _frameBuffer.clear();
    frameCount = 0;
    lastError = null;

    _controller?.runJavaScript('startExtraction();');
  }

  Future<void> addFrame(CameraImage image) async {
    if (!_isInitialized || frameCount >= SEQUENCE_LENGTH) return;

    // Convert YUV to base64
    final bytes = _convertYuvToJpeg(image);
    final base64 = base64Encode(bytes);

    await _controller?.runJavaScript(
      'addFrame("data:image/jpeg;base64,$base64");'
    );
  }

  Future<ExtractionResult> finish() async {
    await _controller?.runJavaScript('finishExtraction();');

    try {
      final result = await _extractionCompleter.future
          .timeout(const Duration(seconds: 10));

      return ExtractionResult(
        features: result['features'],
        frameCount: result['frameCount'],
        hasMotion: result['hasHands'] || result['hasPose'],
      );
    } catch (e) {
      return ExtractionResult(
        features: List.filled(SEQUENCE_LENGTH * FEATURE_DIM, 0.0),
        frameCount: 0,
        hasMotion: false,
      );
    }
  }

  Uint8List _convertYuvToJpeg(CameraImage image) {
    // Simplified: just take Y plane
    // For production: proper YUV420 to RGB conversion
    return image.planes[0].bytes;
  }

  String _getWebViewHtml() {
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js"></script>
</head>
<body>
  <canvas id="canvas" width="640" height="480" style="display:none;"></canvas>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let holistic;
    let frames = [];
    let isExtracting = false;

    // Initialize MediaPipe Holistic
    holistic = new Holistic({
      locateFile: (file) => {
        return \`https://cdn.jsdelivr.net/npm/@mediapipe/holistic/\${file}\`;
      }
    });

    holistic.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    holistic.onResults(onResults);

    function startExtraction() {
      frames = [];
      isExtracting = true;
    }

    async function addFrame(base64Image) {
      if (!isExtracting || frames.length >= 64) return;

      const img = new Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        await holistic.send({image: canvas});
      };
      img.src = base64Image;
    }

    function onResults(results) {
      // Extract features theo schema v2_holistic_subset
      const frame = {
        leftHand: extractHandLandmarks(results.leftHandLandmarks),
        rightHand: extractHandLandmarks(results.rightHandLandmarks),
        pose: extractPoseLandmarks(results.poseLandmarks),
        face: extractFaceLandmarks(results.faceLandmarks),
      };

      frames.push(frame);

      FlutterBridge.postMessage(JSON.stringify({
        type: 'frame_processed',
        frameCount: frames.length
      }));
    }

    function extractHandLandmarks(landmarks) {
      if (!landmarks) return new Array(63).fill(0);
      const result = [];
      for (const lm of landmarks) {
        result.push(lm.x, lm.y, lm.z);
      }
      return result;
    }

    function extractPoseLandmarks(landmarks) {
      if (!landmarks) return new Array(36).fill(0);
      const indices = [0, 11, 12, 13, 14, 15, 16, 23, 24]; // Pose subset
      const result = [];
      for (const idx of indices) {
        const lm = landmarks[idx];
        result.push(lm.x, lm.y, lm.z, lm.visibility || 1.0);
      }
      return result;
    }

    function extractFaceLandmarks(landmarks) {
      // Simplified: return zeros for now
      return new Array(123).fill(0);
    }

    function finishExtraction() {
      isExtracting = false;

      if (frames.length === 0) {
        FlutterBridge.postMessage(JSON.stringify({
          type: 'error',
          message: 'No frames captured'
        }));
        return;
      }

      // Resample to 64 frames
      const resampled = resampleFrames(frames, 64);

      // Flatten features
      const features = [];
      for (const frame of resampled) {
        features.push(...frame.leftHand);
        features.push(...frame.rightHand);
        features.push(...frame.pose);
        features.push(...frame.face);
        // Add quality, motion, geometry features (simplified)
        features.push(...new Array(42).fill(0)); // 8+18+16
      }

      FlutterBridge.postMessage(JSON.stringify({
        type: 'extraction_complete',
        features: features,
        quality: {
          frameCount: frames.length,
          hasHands: frames.some(f => f.leftHand.some(v => v !== 0) || f.rightHand.some(v => v !== 0)),
          hasPose: frames.some(f => f.pose.some(v => v !== 0))
        }
      }));
    }

    function resampleFrames(frames, targetLength) {
      if (frames.length === targetLength) return frames;

      const result = [];
      const step = frames.length / targetLength;

      for (let i = 0; i < targetLength; i++) {
        const idx = Math.floor(i * step);
        result.push(frames[idx]);
      }

      return result;
    }
  </script>
</body>
</html>
    ''';
  }

  void dispose() {
    _controller = null;
    _isInitialized = false;
  }
}

class ExtractionResult {
  final List<double> features;
  final int frameCount;
  final bool hasMotion;

  ExtractionResult({
    required this.features,
    required this.frameCount,
    required this.hasMotion,
  });
}
