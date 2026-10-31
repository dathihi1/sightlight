# Google Sign-In Setup Guide

## Lỗi hiện tại
```
GoogleSignInException(code GoogleSignInExceptionCode.clientConfigurationError, serverClientId must be provided on Android, null)
```

## Cách fix

### Bước 1: Lấy Web Client ID từ Firebase Console

1. Mở [Firebase Console](https://console.firebase.google.com/)
2. Chọn project **SignLight**
3. Vào **Project Settings** (bánh răng góc trên bên trái)
4. Tab **General** → scroll xuống **Your apps**
5. Chọn app Android `vn.duy.signlight.sightlight_flutter`
6. Tìm **Web Client ID** (loại: Web application)
   - Format: `XXXXXXXX-YYYYYYYY.apps.googleusercontent.com`
   - KHÁC với Android Client ID hiện tại: `701794322092-f9k658h8vgrftuv8t4mfk50ctnk7vc50.apps.googleusercontent.com`

### Bước 2: Thêm SHA-1 fingerprint (nếu chưa có)

```bash
# Debug keystore
cd C:\Users\nguye\.android
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android

# Copy SHA-1 fingerprint, ví dụ: 
# SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

Thêm SHA-1 vào Firebase Console:
- **Project Settings** → **Your apps** → Android app
- Scroll xuống → **Add fingerprint**
- Paste SHA-1 → Save

### Bước 3: Tải file `google-services.json` mới

1. Firebase Console → **Project Settings**
2. Android app → Click **Download google-services.json**
3. Copy file vào: `android/app/google-services.json`
4. Overwrite file cũ

### Bước 4: Update code với Web Client ID

File: `lib/presentation/providers/auth_provider.dart`

```dart
await googleSignIn.initialize(
  clientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',  // Web Client ID
);
```

## Client ID types

| Type | Purpose | Example |
|------|---------|---------|
| **Web Client ID** | Backend verification, Android serverClientId | `123456-abc.apps.googleusercontent.com` |
| **Android Client ID** | Android app signing | `701794322092-f9k658h8vgrftuv8t4mfk50ctnk7vc50.apps.googleusercontent.com` |

## Kiểm tra

Sau khi có Web Client ID đúng:
1. Update code
2. `flutter clean && flutter build apk --debug`
3. `adb install -r build/app/outputs/flutter-apk/app-debug.apk`
4. Test Google Sign-In → không còn lỗi `serverClientId`

## Tham khảo
- [Google Sign-In Flutter Setup](https://pub.dev/packages/google_sign_in)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
