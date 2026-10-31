# Chạy Android

## Hiện tại không có device/emulator

```
flutter devices
# Found 3 connected devices:
#   Windows (desktop)
#   Chrome (web)
#   Edge (web)
```

## Cách chạy Android:

### Option 1: Android Emulator (Khuyến nghị)

```bash
# List emulators
flutter emulators

# Tạo emulator mới (nếu chưa có)
# Mở Android Studio > Device Manager > Create Device
# Chọn: Pixel 6 API 34

# Start emulator
flutter emulators --launch <emulator_id>

# Chạy app
flutter run
```

### Option 2: Thiết bị thật

1. Bật **USB Debugging** trên điện thoại:
   - Settings > About Phone > Tap "Build number" 7 lần
   - Settings > Developer Options > USB Debugging ON

2. Kết nối USB và chạy:
```bash
flutter devices  # Kiểm tra device xuất hiện
flutter run
```

### Option 3: Wireless ADB (Android 11+)

```bash
# Trên điện thoại: Settings > Developer Options > Wireless debugging
# Pair device và connect

adb connect <IP>:<PORT>
flutter run
```

## ✅ Đã cấu hình sẵn:

- ✅ **Internet permission** trong AndroidManifest.xml
- ✅ **Cleartext traffic** allowed (cho localhost dev)
- ✅ **Package name:** `vn.duy.signlight.sightlight_flutter`
- ✅ **Min SDK:** Flutter default (~21)
- ✅ **Target SDK:** Flutter default (~34)

## Backend URL cho Android:

Khi chạy trên emulator/device, backend ở `localhost:8080` cần đổi URL:

**Android Emulator:**
```dart
// lib/core/constants/api_constants.dart
static const String baseUrl = 'http://10.0.2.2:8080';
```

**Android Device (real):**
```dart
// Backend phải chạy trên cùng WiFi
static const String baseUrl = 'http://192.168.x.x:8080'; // IP máy chạy backend
```

## Troubleshooting

### Lỗi: "No connected devices"
→ Cài Android emulator hoặc kết nối device

### Lỗi: "Connection refused"
→ Kiểm tra backend đang chạy và URL đúng (`10.0.2.2` cho emulator)

### Lỗi: "Cleartext HTTP traffic not permitted"
→ Đã fix bằng `android:usesCleartextTraffic="true"`

## Chạy build APK

```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# APK output:
# build/app/outputs/flutter-apk/app-debug.apk
# build/app/outputs/flutter-apk/app-release.apk
```
