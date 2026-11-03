import 'dart:typed_data';
import 'dart:math';

import 'package:camera/camera.dart';
import 'package:google_mlkit_pose_detection/google_mlkit_pose_detection.dart';
import 'package:google_mlkit_commons/google_mlkit_commons.dart';
import 'package:flutter/foundation.dart' show WriteBuffer;
import 'package:flutter/painting.dart' show Size;
import 'package:sightlight_flutter/core/ai/handmark_tracker.dart';

/// MediaPipe feature extractor - port từ web extractor.ts
/// Trích xuất 327 chiều features theo schema v2_holistic_subset
class MediaPipeExtractor {
  static const int SEQUENCE_LENGTH = 64;
  static const int FEATURE_DIM = 327;
  static const int MIN_USEFUL_FRAMES = 8;
  static const int MAX_USEFUL_FRAMES = 32;

  late final PoseDetector _poseDetector;
  bool _isInitialized = false;

  final List<_RawFrame> _rawFrames = [];
  int _handFrames = 0;
  int _bothHandFrames = 0;
  int _poseFrames = 0;
  DateTime? _startedAt;

  // Debug state
  List<Pose> lastDetectedPoses = [];
  Size? lastImageSize;
  bool _isProcessing = false;
  String? lastError;

  MediaPipeExtractor() {
    _poseDetector = PoseDetector(options: PoseDetectorOptions());
    _isInitialized = true;
  }

  bool get isInitialized => _isInitialized;
  int get usefulFrameCount => _rawFrames.length;
  bool get isFull => _rawFrames.length >= SEQUENCE_LENGTH;

  void start() {
    _rawFrames.clear();
    _handFrames = 0;
    _bothHandFrames = 0;
    _poseFrames = 0;
    _startedAt = DateTime.now();
  }

  Future<void> addFrame(CameraImage cameraImage) async {
    if (isFull || !_isInitialized || _isProcessing) return;

    _isProcessing = true;
    try {
      final inputImage = _convertCameraImage(cameraImage);

      print(
        '[MediaPipe] Processing image: ${cameraImage.width}x${cameraImage.height}, format: ${cameraImage.format.group}',
      );

      final poses = await _poseDetector.processImage(inputImage);

      print('[MediaPipe] Detected ${poses.length} poses');

      // Store for debug visualization
      lastDetectedPoses = poses;
      lastImageSize = Size(
        cameraImage.width.toDouble(),
        cameraImage.height.toDouble(),
      );
      lastError = null;

      // Extract landmarks
      // Hand detection not available in google_ml_kit - stub with zeros
      final leftHand = List<double>.filled(63, 0.0); // 21 landmarks × 3
      final rightHand = List<double>.filled(63, 0.0); // 21 landmarks × 3
      final pose = _extractPoseLandmarks(poses);
      final face = List<double>.filled(123, 0.0); // Face mesh not available

      final hasLeft = false;
      final hasRight = false;
      final hasPose = pose.any((v) => v != 0.0);
      final hasAnyHand = false;

      if (hasAnyHand) _handFrames++;
      if (hasLeft && hasRight) _bothHandFrames++;
      if (hasPose) _poseFrames++;

      // Quality vector (8 chiều)
      final quality = [
        hasLeft ? 1.0 : 0.0,
        hasRight ? 1.0 : 0.0,
        hasPose ? 1.0 : 0.0,
        0.0, // face_detected = false (chưa có face mesh)
        hasAnyHand ? 1.0 : 0.0,
        (hasLeft && hasRight) ? 1.0 : 0.0,
        hasAnyHand ? 0.0 : 1.0, // hand_missing_rate
        1.0, // face_missing_rate = 1.0
      ];

      _rawFrames.add(
        _RawFrame(
          leftHand: leftHand,
          rightHand: rightHand,
          pose: pose,
          face: face,
          quality: quality,
        ),
      );
    } catch (e, stackTrace) {
      lastError = e.toString();
      print('[MediaPipe] ERROR: $e');
      print('[MediaPipe] Stack: $stackTrace');
      // Skip frame on error
    } finally {
      _isProcessing = false;
    }
  }

  /// Thu đặc trưng trực tiếp từ MediaPipe Hand Landmarker đang vẽ handmark.
  /// Nhờ dùng chung một kết quả landmark, giao diện và suy luận on-device luôn
  /// đánh giá đúng những frame mà người dùng nhìn thấy trong lúc thực hiện.
  void addHandmarkSnapshot(HandmarkSnapshot snapshot) {
    if (isFull || !_isInitialized) return;

    final hands = snapshot.mediaPipeHands
        .where((hand) => hand.length >= 21)
        .take(2)
        .toList(growable: false);

    List<HandmarkPoint>? left;
    List<HandmarkPoint>? right;
    if (hands.length == 1) {
      // Đa số ký hiệu một tay trong bộ MVP dùng tay thuận bên phải.
      right = hands.first;
    } else if (hands.length >= 2) {
      final ordered = [...hands]
        ..sort((a, b) => a.first.x.compareTo(b.first.x));
      if (snapshot.lensDirection == CameraLensDirection.front) {
        // Buffer camera trước không mirror; tay phải của người tập nằm phía
        // trái ảnh dù preview đã được mirror cho cảm giác như soi gương.
        right = ordered.first;
        left = ordered.last;
      } else {
        left = ordered.first;
        right = ordered.last;
      }
    }

    final hasLeft = left != null;
    final hasRight = right != null;
    final hasAnyHand = hasLeft || hasRight;
    if (hasAnyHand) _handFrames++;
    if (hasLeft && hasRight) _bothHandFrames++;

    _rawFrames.add(
      _RawFrame(
        leftHand: _flattenHand(left),
        rightHand: _flattenHand(right),
        pose: List<double>.filled(36, 0.0),
        face: List<double>.filled(123, 0.0),
        quality: [
          hasLeft ? 1.0 : 0.0,
          hasRight ? 1.0 : 0.0,
          0.0,
          0.0,
          hasAnyHand ? 1.0 : 0.0,
          hasLeft && hasRight ? 1.0 : 0.0,
          hasAnyHand ? 0.0 : 1.0,
          1.0,
        ],
      ),
    );
  }

  List<double> _flattenHand(List<HandmarkPoint>? hand) {
    if (hand == null) return List<double>.filled(63, 0.0);
    return [
      for (final point in hand.take(21)) ...[point.x, point.y, point.z],
    ];
  }

  ExtractionResult finish() {
    final durationMs = _startedAt != null
        ? DateTime.now().difference(_startedAt!).inMilliseconds
        : 0;

    if (_rawFrames.isEmpty) {
      return ExtractionResult(
        features: List.generate(
          SEQUENCE_LENGTH,
          (_) => List<double>.filled(FEATURE_DIM, 0.0),
        ),
        frameCount: 0,
        durationMs: durationMs,
        quality: FrameQuality(
          handFrameRatio: 0.0,
          bothHandsRatio: 0.0,
          poseDetected: false,
        ),
      );
    }

    final validCount = _rawFrames.where((f) => f.quality[4] > 0.5).length;

    // Build base sequence (285 chiều: hands + pose + face)
    List<List<double>> baseSeq = _rawFrames.map((f) {
      return [...f.leftHand, ...f.rightHand, ...f.pose, ...f.face];
    }).toList();

    List<List<double>> qualitySeq = _rawFrames.map((f) {
      return [...f.quality];
    }).toList();

    // Update missing rates
    for (int t = 0; t < qualitySeq.length; t++) {
      qualitySeq[t][6] = 1.0 - qualitySeq[t][4]; // hand_missing_rate
      qualitySeq[t][7] = 1.0 - qualitySeq[t][3]; // face_missing_rate
    }

    // Normalize sequence
    _normalizeBaseSequence(baseSeq, qualitySeq);

    // Resample to 64 frames
    baseSeq = _resampleSequence(baseSeq, SEQUENCE_LENGTH);
    qualitySeq = _resampleSequence(qualitySeq, SEQUENCE_LENGTH);

    // Clean quality after interpolation
    for (int t = 0; t < SEQUENCE_LENGTH; t++) {
      for (int k = 0; k < 6; k++) {
        qualitySeq[t][k] = qualitySeq[t][k] >= 0.5 ? 1.0 : 0.0;
      }
      qualitySeq[t][6] = qualitySeq[t][6].clamp(0.0, 1.0);
      qualitySeq[t][7] = qualitySeq[t][7].clamp(0.0, 1.0);
    }

    // Build derived features (motion + geometry)
    final derived = _buildDerivedFeatures(baseSeq, qualitySeq);

    // Concatenate: base(285) + motion(18) + geometry(16) + quality(8) = 327
    final features = <List<double>>[];
    for (int t = 0; t < SEQUENCE_LENGTH; t++) {
      final row = [
        ...baseSeq[t],
        ...derived[t],
        ...qualitySeq[t],
      ].map(_clampValue).toList();
      features.add(row);
    }

    final handRatio =
        qualitySeq.fold(0.0, (sum, q) => sum + q[4]) / SEQUENCE_LENGTH;
    final bothRatio =
        qualitySeq.fold(0.0, (sum, q) => sum + q[5]) / SEQUENCE_LENGTH;
    final poseRatio =
        qualitySeq.fold(0.0, (sum, q) => sum + q[2]) / SEQUENCE_LENGTH;

    final effectiveFrameCount =
        (validCount > 0 ? validCount : _rawFrames.length).clamp(
          MIN_USEFUL_FRAMES,
          MAX_USEFUL_FRAMES,
        );

    return ExtractionResult(
      features: features,
      frameCount: effectiveFrameCount,
      durationMs: durationMs,
      quality: FrameQuality(
        handFrameRatio: double.parse(handRatio.toStringAsFixed(4)),
        bothHandsRatio: double.parse(bothRatio.toStringAsFixed(4)),
        poseDetected: poseRatio >= 0.5,
      ),
    );
  }

  List<double> _extractPoseLandmarks(List<Pose> poses) {
    if (poses.isEmpty) {
      return List<double>.filled(36, 0.0);
    }

    final pose = poses.first;
    // Pose indices: nose(0), left_shoulder(11), right_shoulder(12),
    // left_elbow(13), right_elbow(14), left_wrist(15), right_wrist(16),
    // left_hip(23), right_hip(24)
    final indices = [
      PoseLandmarkType.nose,
      PoseLandmarkType.leftShoulder,
      PoseLandmarkType.rightShoulder,
      PoseLandmarkType.leftElbow,
      PoseLandmarkType.rightElbow,
      PoseLandmarkType.leftWrist,
      PoseLandmarkType.rightWrist,
      PoseLandmarkType.leftHip,
      PoseLandmarkType.rightHip,
    ];

    final result = <double>[];
    for (final type in indices) {
      final lm = pose.landmarks[type];
      if (lm != null) {
        result.addAll([lm.x, lm.y, lm.z, 1.0]); // visibility = 1.0
      } else {
        result.addAll([0.0, 0.0, 0.0, 0.0]);
      }
    }
    return result;
  }

  void _normalizeBaseSequence(
    List<List<double>> base,
    List<List<double>> quality,
  ) {
    final T = base.length;
    // Left shoulder offset: 126 + 1*4 = 130
    // Right shoulder offset: 126 + 2*4 = 134
    const leftShoulderOffset = 126 + 1 * 4;
    const rightShoulderOffset = 126 + 2 * 4;

    for (int t = 0; t < T; t++) {
      final q = quality[t];
      double? centerX;
      double? centerY;
      double scale = 1.0;

      final poseValid = q[2] > 0.5;
      final leftVis = base[t][leftShoulderOffset + 3];
      final rightVis = base[t][rightShoulderOffset + 3];

      if (poseValid && leftVis > 0.2 && rightVis > 0.2) {
        final lsX = base[t][leftShoulderOffset];
        final lsY = base[t][leftShoulderOffset + 1];
        final rsX = base[t][rightShoulderOffset];
        final rsY = base[t][rightShoulderOffset + 1];
        centerX = (lsX + rsX) / 2.0;
        centerY = (lsY + rsY) / 2.0;
        scale = _hypot(lsX - rsX, lsY - rsY);
      } else {
        // Fallback: use hand/face bounding box
        final ptsX = <double>[];
        final ptsY = <double>[];

        if (q[0] > 0.5) {
          for (int i = 0; i < 21; i++) {
            ptsX.add(base[t][i * 3]);
            ptsY.add(base[t][i * 3 + 1]);
          }
        }
        if (q[1] > 0.5) {
          for (int i = 0; i < 21; i++) {
            ptsX.add(base[t][63 + i * 3]);
            ptsY.add(base[t][63 + i * 3 + 1]);
          }
        }

        if (ptsX.isNotEmpty) {
          centerX = ptsX.reduce((a, b) => a + b) / ptsX.length;
          centerY = ptsY.reduce((a, b) => a + b) / ptsY.length;
          final minX = ptsX.reduce((a, b) => a < b ? a : b);
          final maxX = ptsX.reduce((a, b) => a > b ? a : b);
          final minY = ptsY.reduce((a, b) => a < b ? a : b);
          final maxY = ptsY.reduce((a, b) => a > b ? a : b);
          scale = _hypot(maxX - minX, maxY - minY);
        }
      }

      if (centerX != null && centerY != null) {
        scale = scale < 1e-3 ? 1e-3 : scale;

        // Normalize left hand [0..62]
        if (q[0] > 0.5) {
          for (int i = 0; i < 21; i++) {
            base[t][i * 3] = (base[t][i * 3] - centerX) / scale;
            base[t][i * 3 + 1] = (base[t][i * 3 + 1] - centerY) / scale;
            base[t][i * 3 + 2] = base[t][i * 3 + 2] / scale;
          }
        }

        // Normalize right hand [63..125]
        if (q[1] > 0.5) {
          for (int i = 0; i < 21; i++) {
            base[t][63 + i * 3] = (base[t][63 + i * 3] - centerX) / scale;
            base[t][63 + i * 3 + 1] =
                (base[t][63 + i * 3 + 1] - centerY) / scale;
            base[t][63 + i * 3 + 2] = base[t][63 + i * 3 + 2] / scale;
          }
        }

        // Normalize pose [126..161]
        if (q[2] > 0.5) {
          for (int i = 0; i < 9; i++) {
            final vis = base[t][126 + i * 4 + 3];
            if (vis > 0.2) {
              base[t][126 + i * 4] = (base[t][126 + i * 4] - centerX) / scale;
              base[t][126 + i * 4 + 1] =
                  (base[t][126 + i * 4 + 1] - centerY) / scale;
              base[t][126 + i * 4 + 2] = base[t][126 + i * 4 + 2] / scale;
            }
          }
        }

        // Normalize face [162..284] - currently zeros
      }
    }
  }

  List<List<double>> _resampleSequence(
    List<List<double>> sequence,
    int targetLength,
  ) {
    final T = sequence.length;
    if (T == targetLength) return sequence.map((r) => [...r]).toList();
    if (T == 1) {
      return List.generate(targetLength, (_) => [...sequence[0]]);
    }

    final numDims = sequence[0].length;
    final output = <List<double>>[];

    for (int i = 0; i < targetLength; i++) {
      final pos = (i * (T - 1)) / (targetLength - 1);
      final lower = pos.floor();
      final upper = (lower + 1).clamp(0, T - 1);
      final weight = pos - lower;

      final row = <double>[];
      for (int d = 0; d < numDims; d++) {
        row.add(
          sequence[lower][d] * (1.0 - weight) + sequence[upper][d] * weight,
        );
      }
      output.add(row);
    }

    return output;
  }

  List<List<double>> _buildDerivedFeatures(
    List<List<double>> base,
    List<List<double>> quality,
  ) {
    final geometry = _buildGeometryFeatures(base, quality);
    final motion = _buildMotionFeatures(base, quality, geometry);

    final derived = <List<double>>[];
    for (int t = 0; t < base.length; t++) {
      derived.add([...motion[t], ...geometry[t]]);
    }
    return derived;
  }

  List<List<double>> _buildGeometryFeatures(
    List<List<double>> base,
    List<List<double>> quality,
  ) {
    final T = base.length;
    final out = <List<double>>[];

    for (int t = 0; t < T; t++) {
      final row = List<double>.filled(16, 0.0);
      final q = quality[t];

      // Left hand center
      double leftCenterX = 0.0;
      double leftCenterY = 0.0;
      if (q[0] > 0.5) {
        for (int i = 0; i < 21; i++) {
          leftCenterX += base[t][i * 3];
          leftCenterY += base[t][i * 3 + 1];
        }
        leftCenterX /= 21;
        leftCenterY /= 21;
      }

      // Right hand center
      double rightCenterX = 0.0;
      double rightCenterY = 0.0;
      if (q[1] > 0.5) {
        for (int i = 0; i < 21; i++) {
          rightCenterX += base[t][63 + i * 3];
          rightCenterY += base[t][63 + i * 3 + 1];
        }
        rightCenterX /= 21;
        rightCenterY /= 21;
      }

      // Pose points
      final poseValid = q[2] > 0.5;
      final noseVis = base[t][126 + 3];
      final noseX = poseValid && noseVis > 0.2 ? base[t][126] : 0.0;
      final noseY = poseValid && noseVis > 0.2 ? base[t][126 + 1] : 0.0;

      final lsVis = base[t][126 + 4 + 3];
      final lsX = poseValid && lsVis > 0.2 ? base[t][126 + 4] : 0.0;
      final lsY = poseValid && lsVis > 0.2 ? base[t][126 + 4 + 1] : 0.0;

      final rsVis = base[t][126 + 8 + 3];
      final rsX = poseValid && rsVis > 0.2 ? base[t][126 + 8] : 0.0;
      final rsY = poseValid && rsVis > 0.2 ? base[t][126 + 8 + 1] : 0.0;

      final chestValid =
          (lsX != 0.0 || lsY != 0.0) && (rsX != 0.0 || rsY != 0.0);
      final chestX = chestValid ? (lsX + rsX) / 2.0 : 0.0;
      final chestY = chestValid ? (lsY + rsY) / 2.0 : 0.0;

      // Geometry distances
      row[0] = _pairDist(leftCenterX, leftCenterY, rightCenterX, rightCenterY);
      row[1] = _pairDist(leftCenterX, leftCenterY, chestX, chestY);
      row[2] = _pairDist(rightCenterX, rightCenterY, chestX, chestY);
      row[7] = _pairDist(leftCenterX, leftCenterY, noseX, noseY);
      row[8] = _pairDist(rightCenterX, rightCenterY, noseX, noseY);
      row[9] = _pairDist(leftCenterX, leftCenterY, lsX, lsY);
      row[10] = _pairDist(rightCenterX, rightCenterY, rsX, rsY);

      // Hand spread
      row[11] = _calculateHandSpread(base[t], 0, q[0] > 0.5);
      row[12] = _calculateHandSpread(base[t], 63, q[1] > 0.5);

      // Palm orientation
      row[13] = _calculatePalmProxy(base[t], 0, q[0] > 0.5);
      row[14] = _calculatePalmProxy(base[t], 63, q[1] > 0.5);

      // Torso angle
      if (chestValid) {
        final vecX = rsX - lsX;
        final vecY = rsY - lsY;
        row[15] = _atan2(vecY, vecX) / 3.14159;
      }

      out.add(row);
    }
    return out;
  }

  List<List<double>> _buildMotionFeatures(
    List<List<double>> base,
    List<List<double>> quality,
    List<List<double>> geometry,
  ) {
    final T = base.length;
    final out = List.generate(T, (_) => List<double>.filled(18, 0.0));

    // Compute centers
    final leftCenters = <List<double>>[];
    final rightCenters = <List<double>>[];
    final leftWrists = <List<double>>[];
    final rightWrists = <List<double>>[];

    for (int t = 0; t < T; t++) {
      final q = quality[t];

      if (q[0] > 0.5) {
        double sx = 0.0;
        double sy = 0.0;
        for (int i = 0; i < 21; i++) {
          sx += base[t][i * 3];
          sy += base[t][i * 3 + 1];
        }
        leftCenters.add([sx / 21, sy / 21]);
        leftWrists.add([base[t][0], base[t][1]]);
      } else {
        leftCenters.add([0.0, 0.0]);
        leftWrists.add([0.0, 0.0]);
      }

      if (q[1] > 0.5) {
        double sx = 0.0;
        double sy = 0.0;
        for (int i = 0; i < 21; i++) {
          sx += base[t][63 + i * 3];
          sy += base[t][63 + i * 3 + 1];
        }
        rightCenters.add([sx / 21, sy / 21]);
        rightWrists.add([base[t][63], base[t][64]]);
      } else {
        rightCenters.add([0.0, 0.0]);
        rightWrists.add([0.0, 0.0]);
      }
    }

    // Compute deltas
    for (int t = 1; t < T; t++) {
      final lcxDelta = leftCenters[t][0] - leftCenters[t - 1][0];
      final lcyDelta = leftCenters[t][1] - leftCenters[t - 1][1];
      final lcSpeed = _hypot(lcxDelta, lcyDelta);

      final rcxDelta = rightCenters[t][0] - rightCenters[t - 1][0];
      final rcyDelta = rightCenters[t][1] - rightCenters[t - 1][1];
      final rcSpeed = _hypot(rcxDelta, rcyDelta);

      final lwxDelta = leftWrists[t][0] - leftWrists[t - 1][0];
      final lwyDelta = leftWrists[t][1] - leftWrists[t - 1][1];
      final lwSpeed = _hypot(lwxDelta, lwyDelta);

      final rwxDelta = rightWrists[t][0] - rightWrists[t - 1][0];
      final rwyDelta = rightWrists[t][1] - rightWrists[t - 1][1];
      final rwSpeed = _hypot(rwxDelta, rwyDelta);

      out[t][0] = lcxDelta;
      out[t][1] = lcyDelta;
      out[t][2] = lcSpeed;
      out[t][3] = rcxDelta;
      out[t][4] = rcyDelta;
      out[t][5] = rcSpeed;
      out[t][6] = lwxDelta;
      out[t][7] = lwyDelta;
      out[t][8] = lwSpeed;
      out[t][9] = rwxDelta;
      out[t][10] = rwyDelta;
      out[t][11] = rwSpeed;
      out[t][12] = geometry[t][0] - geometry[t - 1][0];
      out[t][13] = geometry[t][1] - geometry[t - 1][1];
      out[t][14] = geometry[t][2] - geometry[t - 1][2];
      out[t][15] = geometry[t][3] - geometry[t - 1][3];
      out[t][16] = geometry[t][4] - geometry[t - 1][4];
      out[t][17] = (lcSpeed + rcSpeed) / 2.0;
    }

    return out;
  }

  double _calculateHandSpread(List<double> frame, int offset, bool valid) {
    if (!valid) return 0.0;
    final tipIndices = [4, 8, 12, 16, 20];
    final xs = tipIndices.map((i) => frame[offset + i * 3]).toList();
    final ys = tipIndices.map((i) => frame[offset + i * 3 + 1]).toList();
    final dx =
        xs.reduce((a, b) => a > b ? a : b) - xs.reduce((a, b) => a < b ? a : b);
    final dy =
        ys.reduce((a, b) => a > b ? a : b) - ys.reduce((a, b) => a < b ? a : b);
    return _hypot(dx, dy);
  }

  double _calculatePalmProxy(List<double> frame, int offset, bool valid) {
    if (!valid) return 0.0;
    final wristX = frame[offset];
    final wristY = frame[offset + 1];
    final midX = frame[offset + 9 * 3];
    final midY = frame[offset + 9 * 3 + 1];
    return _atan2(midY - wristY, midX - wristX) / 3.14159;
  }

  double _pairDist(double x1, double y1, double x2, double y2) {
    if ((x1 == 0.0 && y1 == 0.0) || (x2 == 0.0 && y2 == 0.0)) return 0.0;
    return _hypot(x1 - x2, y1 - y2);
  }

  double _hypot(double x, double y) {
    return sqrt(x * x + y * y);
  }

  double _atan2(double y, double x) {
    return atan2(y, x);
  }

  double _clampValue(double val) {
    if (!val.isFinite) return 0.0;
    return val.clamp(-50.0, 50.0);
  }

  InputImage _convertCameraImage(CameraImage image) {
    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final Size imageSize = Size(
      image.width.toDouble(),
      image.height.toDouble(),
    );
    final InputImageRotation imageRotation = InputImageRotation.rotation0deg;
    final InputImageFormat inputImageFormat = InputImageFormat.nv21;

    final planeData = image.planes.map((Plane plane) {
      return InputImageMetadata(
        size: imageSize,
        rotation: imageRotation,
        format: inputImageFormat,
        bytesPerRow: plane.bytesPerRow,
      );
    }).toList();

    final metadata = InputImageMetadata(
      size: imageSize,
      rotation: imageRotation,
      format: inputImageFormat,
      bytesPerRow: image.planes.first.bytesPerRow,
    );

    return InputImage.fromBytes(bytes: bytes, metadata: metadata);
  }

  void dispose() {
    if (_isInitialized) {
      _poseDetector.close();
      _isInitialized = false;
    }
  }
}

class _RawFrame {
  final List<double> leftHand; // 63
  final List<double> rightHand; // 63
  final List<double> pose; // 36
  final List<double> face; // 123
  final List<double> quality; // 8

  const _RawFrame({
    required this.leftHand,
    required this.rightHand,
    required this.pose,
    required this.face,
    required this.quality,
  });
}

class ExtractionResult {
  final List<List<double>> features; // 64 × 327
  final int frameCount;
  final int durationMs;
  final FrameQuality quality;

  const ExtractionResult({
    required this.features,
    required this.frameCount,
    required this.durationMs,
    required this.quality,
  });
}

class FrameQuality {
  final double handFrameRatio;
  final double bothHandsRatio;
  final bool poseDetected;

  const FrameQuality({
    required this.handFrameRatio,
    required this.bothHandsRatio,
    required this.poseDetected,
  });
}
