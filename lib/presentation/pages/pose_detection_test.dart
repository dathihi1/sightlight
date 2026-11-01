import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:google_mlkit_commons/google_mlkit_commons.dart';

/// Test page để debug pose detection
class PoseDetectionTest extends StatefulWidget {
  const PoseDetectionTest({Key? key}) : super(key: key);

  @override
  State<PoseDetectionTest> createState() => _PoseDetectionTestState();
}

class _PoseDetectionTestState extends State<PoseDetectionTest> {
  CameraController? _controller;
  PoseDetector? _poseDetector;
  List<Pose> _poses = [];
  bool _isProcessing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initCamera();
    _poseDetector = PoseDetector(options: PoseDetectorOptions());
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _controller = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.nv21
            : ImageFormatGroup.bgra8888,
      );

      await _controller!.initialize();

      _controller!.startImageStream((CameraImage image) {
        if (!_isProcessing) {
          _processImage(image);
        }
      });

      setState(() {});
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    }
  }

  Future<void> _processImage(CameraImage image) async {
    _isProcessing = true;
    try {
      final inputImage = _inputImageFromCameraImage(image);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      final poses = await _poseDetector!.processImage(inputImage);
      setState(() {
        _poses = poses;
        _error = null;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    }
    _isProcessing = false;
  }

  InputImage? _inputImageFromCameraImage(CameraImage image) {
    final camera = _controller!.description;
    final sensorOrientation = camera.sensorOrientation;

    InputImageRotation? rotation;
    if (Platform.isAndroid) {
      var rotationCompensation = sensorOrientation;
      if (camera.lensDirection == CameraLensDirection.front) {
        rotationCompensation = (sensorOrientation + 90) % 360;
      }

      switch (rotationCompensation) {
        case 0:
          rotation = InputImageRotation.rotation0deg;
          break;
        case 90:
          rotation = InputImageRotation.rotation90deg;
          break;
        case 180:
          rotation = InputImageRotation.rotation180deg;
          break;
        case 270:
          rotation = InputImageRotation.rotation270deg;
          break;
        default:
          rotation = InputImageRotation.rotation0deg;
      }
    } else {
      rotation = InputImageRotation.rotation90deg;
    }

    final format = Platform.isAndroid
        ? InputImageFormat.nv21
        : InputImageFormat.bgra8888;

    return InputImage.fromBytes(
      bytes: _concatenatePlanes(image.planes),
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: rotation,
        format: format,
        bytesPerRow: image.planes[0].bytesPerRow,
      ),
    );
  }

  Uint8List _concatenatePlanes(List<Plane> planes) {
    final allBytes = <int>[];
    for (final plane in planes) {
      allBytes.addAll(plane.bytes);
    }
    return Uint8List.fromList(allBytes);
  }

  @override
  void dispose() {
    _controller?.dispose();
    _poseDetector?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return Scaffold(
        appBar: AppBar(title: const Text('Pose Detection Test')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pose Detection Test'),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        children: [
          CameraPreview(_controller!),
          Positioned(
            top: 20,
            left: 20,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Poses detected: ${_poses.length}',
                    style: TextStyle(
                      color: _poses.isEmpty ? Colors.red : Colors.green,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_poses.isNotEmpty)
                    Text(
                      'Landmarks: ${_poses.first.landmarks.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  if (_error != null)
                    Text(
                      'Error: $_error',
                      style: const TextStyle(color: Colors.red, fontSize: 12),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
