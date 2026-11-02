import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';

class HandmarkSnapshot {
  const HandmarkSnapshot({
    required this.poses,
    required this.imageSize,
    required this.rotation,
    required this.lensDirection,
  });

  final List<Pose> poses;
  final Size imageSize;
  final InputImageRotation rotation;
  final CameraLensDirection lensDirection;

  bool get leftVisible => _handVisible(
    PoseLandmarkType.leftWrist,
    PoseLandmarkType.leftThumb,
    PoseLandmarkType.leftIndex,
    PoseLandmarkType.leftPinky,
  );

  bool get rightVisible => _handVisible(
    PoseLandmarkType.rightWrist,
    PoseLandmarkType.rightThumb,
    PoseLandmarkType.rightIndex,
    PoseLandmarkType.rightPinky,
  );

  int get visibleHandCount => (leftVisible ? 1 : 0) + (rightVisible ? 1 : 0);

  bool _handVisible(
    PoseLandmarkType wrist,
    PoseLandmarkType thumb,
    PoseLandmarkType index,
    PoseLandmarkType pinky,
  ) {
    if (poses.isEmpty) return false;
    final landmarks = poses.first.landmarks;
    final wristPoint = landmarks[wrist];
    if (wristPoint == null || wristPoint.likelihood < 0.35) return false;
    return [thumb, index, pinky]
        .map((type) => landmarks[type])
        .whereType<PoseLandmark>()
        .any((point) => point.likelihood >= 0.35);
  }
}

/// Chạy ML Kit Pose trên frame camera để cung cấp handmark hướng dẫn.
/// Kết quả này chỉ dùng để vẽ tại chỗ, không quyết định đúng/sai và không tải ảnh lên.
class HandmarkTracker {
  HandmarkTracker()
    : _detector = PoseDetector(
        options: PoseDetectorOptions(
          model: PoseDetectionModel.base,
          mode: PoseDetectionMode.stream,
        ),
      );

  static const _orientations = <DeviceOrientation, int>{
    DeviceOrientation.portraitUp: 0,
    DeviceOrientation.landscapeLeft: 90,
    DeviceOrientation.portraitDown: 180,
    DeviceOrientation.landscapeRight: 270,
  };

  final PoseDetector _detector;
  bool _processing = false;
  int _lastProcessedAtMs = 0;

  Future<HandmarkSnapshot?> process(
    CameraImage image,
    CameraDescription camera,
    DeviceOrientation deviceOrientation,
  ) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (_processing || now - _lastProcessedAtMs < 90) return null;
    final converted = _inputImage(image, camera, deviceOrientation);
    if (converted == null) return null;

    _processing = true;
    _lastProcessedAtMs = now;
    try {
      final poses = await _detector.processImage(converted.input);
      return HandmarkSnapshot(
        poses: poses,
        imageSize: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: converted.rotation,
        lensDirection: camera.lensDirection,
      );
    } finally {
      _processing = false;
    }
  }

  /// Phân tích một ảnh chụp từ video mẫu. Luồng này chỉ chạy khi người dùng
  /// chủ động bật handmark video mẫu, tránh tốn CPU mặc định trên máy yếu.
  Future<HandmarkSnapshot?> processFile(String path, Size imageSize) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (_processing || now - _lastProcessedAtMs < 250) return null;

    _processing = true;
    _lastProcessedAtMs = now;
    try {
      final poses = await _detector.processImage(InputImage.fromFilePath(path));
      return HandmarkSnapshot(
        poses: poses,
        imageSize: imageSize,
        rotation: InputImageRotation.rotation0deg,
        lensDirection: CameraLensDirection.back,
      );
    } finally {
      _processing = false;
    }
  }

  Future<void> close() async {
    try {
      await _detector.close();
    } catch (_) {
      // Unit tests và quá trình shutdown có thể không còn MethodChannel.
    }
  }

  _ConvertedInput? _inputImage(
    CameraImage image,
    CameraDescription camera,
    DeviceOrientation deviceOrientation,
  ) {
    InputImageRotation? rotation;
    if (Platform.isAndroid) {
      var compensation = _orientations[deviceOrientation];
      if (compensation == null) return null;
      compensation = camera.lensDirection == CameraLensDirection.front
          ? (camera.sensorOrientation + compensation) % 360
          : (camera.sensorOrientation - compensation + 360) % 360;
      rotation = InputImageRotationValue.fromRawValue(compensation);
    } else if (Platform.isIOS) {
      rotation = InputImageRotationValue.fromRawValue(camera.sensorOrientation);
    }
    if (rotation == null) return null;

    final format = InputImageFormatValue.fromRawValue(image.format.raw);
    final supported =
        format != null &&
        ((Platform.isAndroid && format == InputImageFormat.nv21) ||
            (Platform.isIOS && format == InputImageFormat.bgra8888));
    if (!supported || image.planes.length != 1) return null;
    final plane = image.planes.first;
    return _ConvertedInput(
      rotation,
      InputImage.fromBytes(
        bytes: plane.bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: format,
          bytesPerRow: plane.bytesPerRow,
        ),
      ),
    );
  }
}

class _ConvertedInput {
  const _ConvertedInput(this.rotation, this.input);

  final InputImageRotation rotation;
  final InputImage input;
}
