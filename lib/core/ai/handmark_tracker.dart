import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:hand_landmarker/hand_landmarker.dart' as mediapipe;

class HandmarkPoint {
  const HandmarkPoint({required this.x, required this.y, required this.z});

  final double x;
  final double y;
  final double z;
}

class HandmarkSnapshot {
  const HandmarkSnapshot({
    required this.poses,
    required this.imageSize,
    required this.rotation,
    required this.lensDirection,
    this.mediaPipeHands = const [],
    this.sensorOrientation = 0,
  });

  /// ML Kit Pose chỉ còn được dùng cho frame ảnh của video mẫu và iOS.
  final List<Pose> poses;

  /// Camera Android dùng MediaPipe Hand Landmarker: đủ 21 điểm cho mỗi tay.
  final List<List<HandmarkPoint>> mediaPipeHands;
  final Size imageSize;
  final InputImageRotation rotation;
  final CameraLensDirection lensDirection;
  final int sensorOrientation;

  bool get leftVisible =>
      mediaPipeHands.isNotEmpty ||
      _poseHandVisible(
        PoseLandmarkType.leftWrist,
        PoseLandmarkType.leftThumb,
        PoseLandmarkType.leftIndex,
        PoseLandmarkType.leftPinky,
      );

  bool get rightVisible =>
      mediaPipeHands.length >= 2 ||
      _poseHandVisible(
        PoseLandmarkType.rightWrist,
        PoseLandmarkType.rightThumb,
        PoseLandmarkType.rightIndex,
        PoseLandmarkType.rightPinky,
      );

  int get visibleHandCount => mediaPipeHands.isNotEmpty
      ? mediaPipeHands.where((hand) => hand.length >= 21).length
      : (leftVisible ? 1 : 0) + (rightVisible ? 1 : 0);

  bool _poseHandVisible(
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

/// Camera Android dùng MediaPipe Tasks Hand Landmarker native (21 điểm/tay).
/// ML Kit Pose được giữ cho video mẫu/iOS vì plugin MediaPipe chỉ nhận CameraImage Android.
class HandmarkTracker {
  HandmarkTracker()
    : _poseDetector = PoseDetector(
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

  final PoseDetector _poseDetector;
  final StreamController<HandmarkSnapshot> _liveSnapshots =
      StreamController<HandmarkSnapshot>.broadcast();
  mediapipe.HandLandmarkerPlugin? _mediaPipe;
  StreamSubscription<List<mediapipe.Hand>>? _mediaPipeSubscription;
  _LiveFrameMetadata? _latestLiveFrame;
  bool _poseProcessing = false;
  bool _closed = false;
  int _lastLiveFrameAtMs = 0;
  int _lastFileFrameAtMs = 0;

  Stream<HandmarkSnapshot> get liveSnapshots => _liveSnapshots.stream;

  Future<void> startLive() async {
    if (!Platform.isAndroid || _mediaPipe != null) return;

    // CPU ổn định hơn GPU trên các máy Android cũ/giá rẻ. Pipeline được giới
    // hạn khoảng 10 FPS nên vẫn đủ mượt cho lớp hướng dẫn handmark.
    final plugin = mediapipe.HandLandmarkerPlugin.create(
      numHands: 2,
      minHandDetectionConfidence: 0.55,
      delegate: mediapipe.HandLandmarkerDelegate.cpu,
    );
    _mediaPipeSubscription = plugin.landmarkStream.listen(
      (hands) {
        final metadata = _latestLiveFrame;
        if (_closed || metadata == null) return;
        _liveSnapshots.add(
          HandmarkSnapshot(
            poses: const [],
            mediaPipeHands: hands
                .map(
                  (hand) => hand.landmarks
                      .map(
                        (point) =>
                            HandmarkPoint(x: point.x, y: point.y, z: point.z),
                      )
                      .toList(growable: false),
                )
                .toList(growable: false),
            imageSize: metadata.imageSize,
            rotation:
                InputImageRotationValue.fromRawValue(
                  metadata.sensorOrientation,
                ) ??
                InputImageRotation.rotation0deg,
            lensDirection: metadata.lensDirection,
            sensorOrientation: metadata.sensorOrientation,
          ),
        );
      },
      onError: (Object error, StackTrace stackTrace) {
        if (!_closed) _liveSnapshots.addError(error, stackTrace);
      },
    );
    _mediaPipe = plugin;
  }

  void processLiveFrame(
    CameraImage image,
    CameraDescription camera,
    DeviceOrientation deviceOrientation,
  ) {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (now - _lastLiveFrameAtMs < 100) return;
    _lastLiveFrameAtMs = now;

    if (Platform.isAndroid) {
      final plugin = _mediaPipe;
      if (plugin == null) {
        throw StateError('MediaPipe Hand Landmarker chưa được khởi tạo.');
      }
      if (image.planes.length < 3) {
        throw StateError(
          'MediaPipe cần camera YUV420 ba plane, nhận ${image.planes.length} plane.',
        );
      }
      _latestLiveFrame = _LiveFrameMetadata(
        imageSize: Size(image.width.toDouble(), image.height.toDouble()),
        lensDirection: camera.lensDirection,
        sensorOrientation: camera.sensorOrientation,
      );
      plugin.processFrame(image, camera.sensorOrientation);
      return;
    }

    unawaited(_processPoseFrame(image, camera, deviceOrientation));
  }

  Future<void> _processPoseFrame(
    CameraImage image,
    CameraDescription camera,
    DeviceOrientation deviceOrientation,
  ) async {
    if (_poseProcessing) return;
    final converted = _inputImage(image, camera, deviceOrientation);
    if (converted == null) return;

    _poseProcessing = true;
    try {
      final poses = await _poseDetector.processImage(converted.input);
      if (_closed) return;
      _liveSnapshots.add(
        HandmarkSnapshot(
          poses: poses,
          imageSize: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: converted.rotation,
          lensDirection: camera.lensDirection,
          sensorOrientation: camera.sensorOrientation,
        ),
      );
    } catch (error, stackTrace) {
      if (!_closed) _liveSnapshots.addError(error, stackTrace);
    } finally {
      _poseProcessing = false;
    }
  }

  /// Phân tích ảnh chụp từ video mẫu. Luồng này chỉ chạy khi người dùng bật
  /// handmark video mẫu, tránh tốn CPU mặc định trên máy yếu.
  Future<HandmarkSnapshot?> processFile(String path, Size imageSize) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    if (_poseProcessing || now - _lastFileFrameAtMs < 250) return null;

    _poseProcessing = true;
    _lastFileFrameAtMs = now;
    try {
      final poses = await _poseDetector.processImage(
        InputImage.fromFilePath(path),
      );
      return HandmarkSnapshot(
        poses: poses,
        imageSize: imageSize,
        rotation: InputImageRotation.rotation0deg,
        lensDirection: CameraLensDirection.back,
      );
    } finally {
      _poseProcessing = false;
    }
  }

  Future<void> close() async {
    _closed = true;
    await _mediaPipeSubscription?.cancel();
    try {
      _mediaPipe?.dispose();
    } catch (_) {
      // Shutdown có thể diễn ra sau khi Flutter engine đã đóng JNI bridge.
    }
    try {
      await _poseDetector.close();
    } catch (_) {
      // Unit tests và shutdown có thể không còn MethodChannel.
    }
    await _liveSnapshots.close();
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

class _LiveFrameMetadata {
  const _LiveFrameMetadata({
    required this.imageSize,
    required this.lensDirection,
    required this.sensorOrientation,
  });

  final Size imageSize;
  final CameraLensDirection lensDirection;
  final int sensorOrientation;
}

class _ConvertedInput {
  const _ConvertedInput(this.rotation, this.input);

  final InputImageRotation rotation;
  final InputImage input;
}
