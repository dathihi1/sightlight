# MediaPipe Integration Plan - Flutter App

## Vấn đề hiện tại

App Flutter **KHÔNG** trích xuất MediaPipe landmarks thật → tensor features là mock noise → AI model không thể nhận dạng chính xác (score luôn cố định 21%).

File: `lib/presentation/pages/practice/practice_page.dart:407-411`

```dart
// ❌ MOCK TENSOR - KHÔNG DÙNG MEDIAPIPE
final features = List.generate(sequenceLength, (fIdx) {
  final t = fIdx / (sequenceLength - 1.0);
  final energy = (_motionAccumulator / 100.0).clamp(0.0, 1.0);
  return List.generate(327, (dim) => (t * energy * 0.05)); // ← NOISE, không phải landmarks thật
});
```

## Giải pháp: Tích hợp MediaPipe

### 1. Thêm dependencies

**File:** `pubspec.yaml`

```yaml
dependencies:
  # ... existing deps ...
  camera: ^0.12.2  # ✅ đã có
  onnxruntime: ^1.4.1  # ✅ đã có
  
  # ⚠️ CẦN THÊM:
  google_ml_kit: ^0.18.0  # MediaPipe Hands + Pose detection
  # HOẶC dùng FFI wrapper tự build nếu cần full holistic
```

**Lưu ý:** `google_ml_kit` chỉ có Hands + Pose, KHÔNG có Face Mesh đầy đủ 478 landmarks như web. Nếu cần face mesh, phải:
- Dùng FFI (`dart:ffi`) gọi native MediaPipe C++ API
- Hoặc giảm face features xuống còn pose keypoints (đơn giản hơn)

### 2. Tạo MediaPipe Extractor

**File mới:** `lib/core/ai/mediapipe_extractor.dart`

```dart
import 'package:google_ml_kit/google_ml_kit.dart';
import 'package:camera/camera.dart';

/// Trích xuất 327 chiều features theo chuẩn v2_holistic_subset
/// Khớp với web: src/frontend/lib/holistic/extractor.ts
class MediaPipeExtractor {
  static const int SEQUENCE_LENGTH = 64;
  static const int FEATURE_DIM = 327;
  static const int MIN_USEFUL_FRAMES = 8;
  
  final HandDetector _handDetector = HandDetector(
    options: HandDetectorOptions(
      mode: DetectionMode.stream,
      maxHands: 2,
    ),
  );
  
  final PoseDetector _poseDetector = PoseDetector(
    options: PoseDetectorOptions(
      mode: PoseDetectionMode.stream,
    ),
  );
  
  final List<RawFrame> _rawFrames = [];
  int _handFrames = 0;
  DateTime? _startedAt;
  
  void start() {
    _rawFrames.clear();
    _handFrames = 0;
    _startedAt = DateTime.now();
  }
  
  Future<void> addFrame(CameraImage image) async {
    if (_rawFrames.length >= SEQUENCE_LENGTH) return;
    
    // Convert CameraImage → InputImage
    final inputImage = _convertCameraImage(image);
    
    // Detect hands + pose
    final hands = await _handDetector.processImage(inputImage);
    final poses = await _poseDetector.processImage(inputImage);
    
    // Extract landmarks
    final leftHand = _extractHandLandmarks(hands, isLeft: true);
    final rightHand = _extractHandLandmarks(hands, isLeft: false);
    final pose = _extractPoseLandmarks(poses);
    
    final hasLeft = leftHand.isNotEmpty;
    final hasRight = rightHand.isNotEmpty;
    final hasPose = pose.isNotEmpty;
    
    if (hasLeft || hasRight) _handFrames++;
    
    // Face landmarks = zeros (google_ml_kit không có full face mesh)
    final face = List.filled(123, 0.0);
    
    final quality = [
      hasLeft ? 1.0 : 0.0,
      hasRight ? 1.0 : 0.0,
      hasPose ? 1.0 : 0.0,
      0.0, // face_detected = false
      (hasLeft || hasRight) ? 1.0 : 0.0,
      (hasLeft && hasRight) ? 1.0 : 0.0,
      (hasLeft || hasRight) ? 0.0 : 1.0,
      1.0, // face_missing_rate = 1.0
    ];
    
    _rawFrames.add(RawFrame(
      leftHand: leftHand,
      rightHand: rightHand,
      pose: pose,
      face: face,
      quality: quality,
    ));
  }
  
  ExtractionResult finish() {
    final durationMs = _startedAt != null 
        ? DateTime.now().difference(_startedAt!).inMilliseconds 
        : 0;
    
    if (_rawFrames.isEmpty) {
      return ExtractionResult(
        features: List.generate(SEQUENCE_LENGTH, (_) => List.filled(FEATURE_DIM, 0.0)),
        frameCount: 0,
        durationMs: durationMs,
        handFrameRatio: 0.0,
      );
    }
    
    // Chuẩn hóa, nội suy, trim idle, resample → 64 khung
    final normalized = _normalizeSequence(_rawFrames);
    final resampled = _resampleTo64Frames(normalized);
    
    // Tính motion + geometry features
    final features = _buildFullFeatures(resampled);
    
    final handRatio = _handFrames / _rawFrames.length;
    final effectiveFrameCount = (_handFrames).clamp(MIN_USEFUL_FRAMES, 32);
    
    return ExtractionResult(
      features: features,
      frameCount: effectiveFrameCount,
      durationMs: durationMs,
      handFrameRatio: handRatio,
    );
  }
  
  List<double> _extractHandLandmarks(List<Hand> hands, {required bool isLeft}) {
    final hand = hands.firstWhere(
      (h) => h.isLeft == isLeft,
      orElse: () => null as Hand,
    );
    
    if (hand == null) return List.filled(63, 0.0); // 21 landmarks × 3
    
    final landmarks = <double>[];
    for (final lm in hand.landmarks) {
      landmarks.addAll([lm.x, lm.y, lm.z]);
    }
    return landmarks;
  }
  
  List<double> _extractPoseLandmarks(List<Pose> poses) {
    if (poses.isEmpty) return List.filled(36, 0.0); // 9 landmarks × 4
    
    final pose = poses.first;
    final indices = [0, 11, 12, 13, 14, 15, 16, 23, 24]; // nose, shoulders, elbows, wrists, hips
    
    final landmarks = <double>[];
    for (final idx in indices) {
      final lm = pose.landmarks[PoseLandmarkType.values[idx]];
      if (lm != null) {
        landmarks.addAll([lm.x, lm.y, lm.z, 1.0]); // visibility = 1.0
      } else {
        landmarks.addAll([0.0, 0.0, 0.0, 0.0]);
      }
    }
    return landmarks;
  }
  
  // TODO: Implement chuẩn hóa theo mid-shoulder anchor
  List<RawFrame> _normalizeSequence(List<RawFrame> frames) {
    // Port logic từ web: src/frontend/lib/holistic/extractor.ts:292-389
    // normalizeBaseSequence()
    return frames; // placeholder
  }
  
  // TODO: Implement resample về 64 khung
  List<RawFrame> _resampleTo64Frames(List<RawFrame> frames) {
    // Port logic từ web: extractor.ts:505-527
    return frames; // placeholder
  }
  
  // TODO: Build motion + geometry features
  List<List<double>> _buildFullFeatures(List<RawFrame> frames) {
    // Port logic từ web: extractor.ts:529-777
    return frames.map((f) => [...f.leftHand, ...f.rightHand, ...f.pose, ...f.face, ...f.quality]).toList();
  }
  
  InputImage _convertCameraImage(CameraImage image) {
    // Convert YUV420/NV21 → InputImage
    // Ref: https://pub.dev/packages/google_ml_kit#camera-image-to-inputimage
    throw UnimplementedError('TODO: implement camera conversion');
  }
  
  void dispose() {
    _handDetector.close();
    _poseDetector.close();
  }
}

class RawFrame {
  final List<double> leftHand; // 63
  final List<double> rightHand; // 63
  final List<double> pose; // 36
  final List<double> face; // 123
  final List<double> quality; // 8
  
  const RawFrame({
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
  final double handFrameRatio;
  
  const ExtractionResult({
    required this.features,
    required this.frameCount,
    required this.durationMs,
    required this.handFrameRatio,
  });
}
```

### 3. Thay thế mock tensor trong practice_page.dart

**File:** `lib/presentation/pages/practice/practice_page.dart`

```dart
// ❌ XÓA phần mock tensor (line 407-411)

// ✅ THAY BẰNG:
import 'package:sightlight_flutter/core/ai/mediapipe_extractor.dart';

// Trong _PracticePageState:
MediaPipeExtractor? _extractor;

@override
void initState() {
  super.initState();
  _extractor = MediaPipeExtractor();
  // ... existing code
}

void _startPractice() {
  _extractor?.start();
  // ... existing code
  _startMotionTracking(); // ← THAY ĐỔI để gọi MediaPipe
}

void _startMotionTracking() {
  // ... existing camera setup
  
  controller.startImageStream((CameraImage image) async {
    if (!_isStreaming) return;
    _motionSampleCount++;
    
    // ✅ THÊM: Extract MediaPipe landmarks
    await _extractor?.addFrame(image);
  });
}

Future<void> _finishRecording() async {
  // ... existing code
  
  // ✅ THAY: Lấy features từ MediaPipe
  final extraction = _extractor!.finish();
  
  // Kiểm tra quality gate
  if (extraction.frameCount < 8) {
    // Not enough frames
    return;
  }
  
  // ✅ GỬI features THẬT lên backend
  attemptRes = await ref.read(practiceRepositoryProvider).submitAiAttempt(
    targetSignId: sign.id,
    modelVersion: _modelVersion,
    features: extraction.features, // ← TENSOR THẬT
    frameCount: extraction.frameCount,
    durationMs: extraction.durationMs,
    handFrameRatio: extraction.handFrameRatio,
    sessionId: _sessionId,
  );
  
  // ... existing scoring logic
}
```

### 4. Port logic chuẩn hóa từ web

**Các hàm CẦN port từ `extractor.ts`:**

1. ✅ `normalizeBaseSequence()` - Chuẩn hóa theo mid-shoulder anchor (line 292-389)
2. ✅ `interpolateMissingGroups()` - Nội suy khung mất ngắn (line 391-422)
3. ✅ `trimIdleFrames()` - Cắt khung đứng yên đầu/cuối (line 424-451)
4. ✅ `resampleSequence()` - Kéo giãn/nén về 64 khung (line 505-527)
5. ✅ `buildGeometryFeatures()` - 16 chiều khoảng cách (line 541-665)
6. ✅ `buildMotionFeatures()` - 18 chiều vận tốc (line 688-777)

**Độ ưu tiên port:**
- **P0 (bắt buộc):** Resample, normalize
- **P1 (quan trọng):** Motion, geometry features
- **P2 (tốt nếu có):** Interpolate, trim idle

## Lộ trình triển khai

### Phase 1: Proof of Concept (1-2 ngày)
- ✅ Add `google_ml_kit` dependency
- ✅ Tạo `MediaPipeExtractor` class cơ bản
- ✅ Extract hand landmarks (21 points × 2 hands)
- ✅ Extract pose landmarks (9 points)
- ✅ Replace mock tensor với landmarks thật
- ✅ Test 1 từ đơn giản

### Phase 2: Full Feature Parity (3-5 ngày)
- ✅ Port normalize logic từ web
- ✅ Port resample logic
- ✅ Build motion features (18 chiều)
- ✅ Build geometry features (16 chiều)
- ✅ Test với 10+ từ trong model

### Phase 3: Production Hardening (2-3 ngày)
- ✅ Error handling
- ✅ Performance optimization (cache detector instances)
- ✅ Memory leak prevention (dispose properly)
- ✅ Handle edge cases (no hands detected, single hand, etc.)
- ✅ Add telemetry (extraction success rate, avg latency)

## Lưu ý quan trọng

### Face Mesh limitation
`google_ml_kit` KHÔNG có Face Mesh 478 landmarks như web. Có 3 options:

**Option A (đơn giản):** Skip face features → set face = zeros (123 chiều)
- Model vẫn chạy được (đã test trên web với stubMode)
- Độ chính xác giảm ~5-10% cho từ cần facial expression

**Option B (khuyến nghị):** Dùng FaceDetector từ google_ml_kit
- Có face bounding box + 5 landmarks (eyes, nose, mouth corners)
- Extrapolate thành 41 landmarks cần thiết cho model
- Độ chính xác tốt hơn Option A

**Option C (tốt nhất nhưng phức tạp):** FFI native MediaPipe
- Build MediaPipe C++ SDK cho Android/iOS
- Wrap qua FFI (`dart:ffi`)
- Full 478 face landmarks như web
- Công sức cao, khuyên dùng khi Option B không đủ

### Backend 503 Error
Lỗi hiện tại do:
- Tensor mock không hợp lệ → backend từ chối
- Hoặc backend đang down/overloaded

Sau khi fix MediaPipe, nếu 503 vẫn xuất hiện → kiểm tra backend logs.

## Testing Checklist

- [ ] Extractor khởi tạo thành công
- [ ] Camera stream → MediaPipe detection không crash
- [ ] Extract ≥ 8 useful frames cho 1 cử chỉ 2s
- [ ] Tensor shape = [64, 327] đúng chuẩn
- [ ] Backend nhận tensor và trả về top3 predictions
- [ ] Score thay đổi theo cử chỉ (không còn fix 21%)
- [ ] Dispose detector khi rời page (no memory leak)
- [ ] Test trên Android + iOS
- [ ] Test với model 30 từ + 400 từ

## Tài liệu tham khảo

- Web extractor: `src/frontend/lib/holistic/extractor.ts`
- Web schema: `src/frontend/lib/holistic/featureSchema.ts`
- MediaPipe Hands: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
- google_ml_kit: https://pub.dev/packages/google_ml_kit
