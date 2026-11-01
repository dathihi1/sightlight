# Hand Detection Options cho Flutter

## Vấn đề hiện tại
`google_ml_kit` **KHÔNG có** hand detection → thiếu 21 landmarks × 2 hands = 126 chiều features → accuracy thấp (~30-50%).

## Option 1: MediaPipe Tasks Vision (Native FFI) ⭐ KHUYẾN NGHỊ

**Ưu điểm:**
- ✅ Đầy đủ 21 hand landmarks × 2 hands
- ✅ Chính xác cao (giống web)
- ✅ Hiệu năng tốt (native code)
- ✅ Official MediaPipe solution

**Nhược điểm:**
- ❌ Phức tạp: phải setup FFI bindings
- ❌ Phải build native cho Android + iOS
- ❌ Tốn thời gian (1-2 ngày)

**Cách làm:**

### 1. Thêm dependencies

```yaml
# pubspec.yaml
dependencies:
  ffi: ^2.1.0
  
dev_dependencies:
  ffigen: ^13.0.0
```

### 2. Download MediaPipe Tasks model

```bash
# Android
wget https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
mv hand_landmarker.task android/app/src/main/assets/

# iOS
mv hand_landmarker.task ios/Runner/Assets/
```

### 3. Setup Android native (Kotlin)

**android/app/build.gradle:**
```gradle
android {
    // ...
    sourceSets {
        main {
            jniLibs.srcDirs = ['libs']
        }
    }
}

dependencies {
    implementation 'com.google.mediapipe:tasks-vision:0.10.9'
}
```

**android/app/src/main/kotlin/.../HandLandmarkerHelper.kt:**
```kotlin
package com.example.sightlight_flutter

import android.content.Context
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult

class HandLandmarkerHelper(context: Context) {
    private var handLandmarker: HandLandmarker? = null
    
    init {
        val baseOptions = BaseOptions.builder()
            .setModelAssetPath("hand_landmarker.task")
            .build()
        
        val options = HandLandmarker.HandLandmarkerOptions.builder()
            .setBaseOptions(baseOptions)
            .setRunningMode(RunningMode.VIDEO)
            .setNumHands(2)
            .build()
        
        handLandmarker = HandLandmarker.createFromOptions(context, options)
    }
    
    fun detect(mpImage: MPImage, frameTimeMs: Long): HandLandmarkerResult? {
        return handLandmarker?.detectForVideo(mpImage, frameTimeMs)
    }
    
    fun close() {
        handLandmarker?.close()
    }
}
```

### 4. Setup iOS native (Swift)

**ios/Podfile:**
```ruby
target 'Runner' do
  use_frameworks!
  use_modular_headers!

  pod 'MediaPipeTasksVision', '~> 0.10.9'
  
  flutter_install_all_ios_pods File.dirname(File.realpath(__FILE__))
end
```

**ios/Runner/HandLandmarkerHelper.swift:**
```swift
import MediaPipeTasksVision

class HandLandmarkerHelper {
    private var handLandmarker: HandLandmarker?
    
    init() {
        let modelPath = Bundle.main.path(forResource: "hand_landmarker", ofType: "task")!
        
        let baseOptions = BaseOptions()
        baseOptions.modelAssetPath = modelPath
        
        let options = HandLandmarkerOptions()
        options.baseOptions = baseOptions
        options.runningMode = .video
        options.numHands = 2
        
        handLandmarker = try? HandLandmarker(options: options)
    }
    
    func detect(image: MPImage, timestampMs: Int) -> HandLandmarkerResult? {
        return try? handLandmarker?.detect(videoFrame: image, timestampInMilliseconds: timestampMs)
    }
}
```

### 5. Setup FFI Dart bindings

**lib/core/ffi/hand_landmarker_ffi.dart:**
```dart
import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';

// FFI type definitions
typedef DetectHandsNative = Pointer<Void> Function(Pointer<Uint8>, Int32, Int32, Int32);
typedef DetectHandsDart = Pointer<Void> Function(Pointer<Uint8>, int, int, int);

class HandLandmarkerFFI {
  late final DynamicLibrary _dylib;
  late final DetectHandsDart _detectHands;
  
  HandLandmarkerFFI() {
    if (Platform.isAndroid) {
      _dylib = DynamicLibrary.open('libhand_landmarker.so');
    } else if (Platform.isIOS) {
      _dylib = DynamicLibrary.process();
    }
    
    _detectHands = _dylib
        .lookup<NativeFunction<DetectHandsNative>>('detect_hands')
        .asFunction();
  }
  
  List<HandLandmarks> detect(Uint8List imageBytes, int width, int height) {
    final pointer = calloc<Uint8>(imageBytes.length);
    pointer.asTypedList(imageBytes.length).setAll(0, imageBytes);
    
    final resultPtr = _detectHands(pointer, width, height, imageBytes.length);
    
    // Parse result...
    calloc.free(pointer);
    
    return []; // Return parsed landmarks
  }
}
```

### 6. Update MediaPipeExtractor

```dart
class MediaPipeExtractor {
  late final HandLandmarkerFFI _handLandmarker;
  
  MediaPipeExtractor() {
    _handLandmarker = HandLandmarkerFFI();
    // ... existing pose detector
  }
  
  Future<void> addFrame(CameraImage image) async {
    // Convert to bytes
    final bytes = _imageToBytes(image);
    
    // Detect hands via FFI
    final hands = _handLandmarker.detect(bytes, image.width, image.height);
    
    // Extract landmarks
    final leftHand = _extractHandLandmarks(hands, isLeft: true);
    final rightHand = _extractHandLandmarks(hands, isLeft: false);
    
    // Continue with pose...
  }
}
```

---

## Option 2: TensorFlow Lite Hand Detection

**Package:** `tflite_flutter`

**Ưu điểm:**
- ✅ Dễ setup hơn FFI
- ✅ Có sẵn hand detection model

**Nhược điểm:**
- ❌ Accuracy thấp hơn MediaPipe
- ❌ Hiệu năng chậm hơn
- ❌ Phải tự train hoặc dùng model có sẵn

**Cách làm:**

```yaml
dependencies:
  tflite_flutter: ^0.10.4
```

```dart
import 'package:tflite_flutter/tflite_flutter.dart';

class HandDetectorTFLite {
  late Interpreter _interpreter;
  
  Future<void> load() async {
    _interpreter = await Interpreter.fromAsset('hand_landmark.tflite');
  }
  
  List<List<double>> detect(Uint8List imageBytes) {
    var input = _preprocessImage(imageBytes);
    var output = List.filled(42, 0.0).reshape([1, 21, 2]); // 21 landmarks × (x,y)
    
    _interpreter.run(input, output);
    return output;
  }
}
```

---

## Option 3: Train lại model chỉ dùng Pose

**Ưu điểm:**
- ✅ Không cần thay đổi Flutter code
- ✅ Dùng luôn pose landmarks có sẵn

**Nhược điểm:**
- ❌ Phải retrain model (cần dataset lớn)
- ❌ Accuracy sẽ thấp hơn (thiếu chi tiết ngón tay)
- ❌ Tốn thời gian training

**Cách làm:**

1. Thu thập dataset với chỉ pose landmarks (9 points)
2. Retrain model với input shape: `[64, 180]` thay vì `[64, 327]`
   - 64 frames
   - 9 pose × 4 coords = 36
   - Motion features = 18
   - Geometry features = 16
   - Quality = 8
   - Face = 123 (zeros)
   - **Bỏ hand features (126 dims)**
3. Deploy model mới

---

## So sánh

| Option | Độ khó | Thời gian | Accuracy | Hiệu năng |
|--------|--------|-----------|----------|-----------|
| MediaPipe FFI | ⭐⭐⭐⭐ | 1-2 ngày | 95-98% | Tốt nhất |
| TFLite | ⭐⭐ | 4-6 giờ | 70-80% | Trung bình |
| Retrain model | ⭐⭐⭐⭐⭐ | 1-2 tuần | 60-70% | Tốt |

---

## Khuyến nghị

**Nếu cần accuracy cao ngay:** → **Option 1 (MediaPipe FFI)**

**Nếu muốn nhanh để demo:** → Giữ nguyên code hiện tại (chỉ pose), giải thích limitation

**Nếu có thời gian lâu dài:** → **Option 3 (Retrain model)** để tối ưu cho mobile

---

## Tài liệu tham khảo

- [MediaPipe Hand Landmarker](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [MediaPipe Tasks Flutter](https://developers.google.com/mediapipe/solutions/setup_flutter)
- [TFLite Flutter](https://pub.dev/packages/tflite_flutter)
- [FFI Documentation](https://dart.dev/guides/libraries/c-interop)
