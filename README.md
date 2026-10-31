# SignLight Flutter App

Flutter mobile app gọi API backend SignLight (Spring Boot).

## Kiến trúc

**Clean Architecture** với 3 layers:

```
lib/
├── core/                    # Cross-cutting concerns
│   ├── constants/          # API endpoints, storage keys
│   ├── network/            # Dio client, interceptors
│   └── storage/            # Token storage (SecureStorage)
├── data/                   # Data layer
│   ├── datasources/        # Remote API calls
│   ├── models/             # DTOs with JSON serialization
│   └── repositories/       # Repository implementations
├── domain/                 # Business logic
│   ├── entities/           # Pure Dart domain models
│   └── repositories/       # Repository interfaces
└── presentation/           # UI layer
    ├── pages/              # Screens
    ├── providers/          # Riverpod state management
    └── widgets/            # Reusable components
```

## Tech Stack

- **State Management:** Riverpod 2.6
- **HTTP Client:** Dio 5.7
- **Code Generation:** Freezed + JSON Serializable
- **Storage:** 
  - `flutter_secure_storage` cho tokens (JWT)
  - `shared_preferences` cho settings

## API Backend

Backend: `http://localhost:8080` (dev) hoặc `https://uat.signlight.local` (UAT)

**Envelope format:**
```json
{
  "requestId": "uuid-v4",
  "errorCode": "00000",
  "errorMessage": null,
  "result": { ... }
}
```

- `errorCode = "00000"` → success
- Mọi request gửi `requestId` (UUID v4) + `version: "1.0"`
- Auth: `Authorization: Bearer <JWT>` header

## Setup

### 1. Cài dependencies

```bash
flutter pub get
```

### 2. Generate code (Freezed + JSON)

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Cấu hình backend URL

Sửa `lib/core/constants/api_constants.dart`:

```dart
static const String baseUrl = 'http://10.0.2.2:8080';  // Android emulator
// static const String baseUrl = 'http://localhost:8080';  // iOS simulator
```

### 4. Chạy app

```bash
flutter run
```

## Các tính năng đã implement

### ✅ Authentication Module

- **Login:** `POST /api/v1/auth/login`
  - Email + password
  - Lưu access_token + refresh_token vào SecureStorage
  - Auto-inject Bearer token vào mọi request

**Files liên quan:**
```
lib/data/models/auth/login_request.dart
lib/data/models/auth/login_response.dart
lib/data/datasources/auth_remote_datasource.dart
lib/data/repositories/auth_repository_impl.dart
lib/domain/repositories/auth_repository.dart
lib/presentation/providers/auth_provider.dart
lib/presentation/pages/login_page.dart
```

### 🔄 Cần thêm

1. **Register:** `POST /api/v1/auth/register`
2. **Google OAuth:** `POST /api/v1/auth/google`
3. **Refresh Token:** `POST /api/v1/auth/refresh` (khi 401)
4. **Courses:** `GET /api/v1/courses`
5. **Lessons:** `GET /api/v1/lessons/{id}`
6. **Dictionary:** `GET /api/v1/dictionary/search`
7. **Practice:** Vocabulary, Fingerspell, Numbers
8. **Payment:** payOS integration

## Code Generation Commands

```bash
# Watch mode (auto-generate khi file thay đổi)
flutter pub run build_runner watch --delete-conflicting-outputs

# Build một lần
flutter pub run build_runner build --delete-conflicting-outputs

# Clean
flutter pub run build_runner clean
```

## Testing

```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test/

# Coverage
flutter test --coverage
lcov --summary coverage/lcov.info
```

## Quy tắc code

### 1. Immutability

```dart
// ✅ GOOD
final user = user.copyWith(isPremium: true);

// ❌ BAD
user.isPremium = true;
```

### 2. Null Safety

```dart
// ✅ GOOD
final name = user?.displayName ?? 'Unknown';

// ❌ BAD (tránh ! operator)
final name = user!.displayName;
```

### 3. Error Handling

```dart
// ✅ GOOD
try {
  await repository.login(email, password);
} on DioException catch (e) {
  if (e.response?.statusCode == 401) {
    // Handle unauthorized
  }
}

// ❌ BAD
catch (e) {
  // Too generic
}
```

### 4. Async/Await

```dart
// ✅ GOOD
await fetchData();

// ✅ GOOD (fire-and-forget với ý định rõ ràng)
unawaited(fetchData());

// ❌ BAD (bỏ qua Future)
fetchData();
```

## Security

### ❌ KHÔNG được

1. Hardcode API keys, tokens trong code
2. Log sensitive data (passwords, tokens)
3. Lưu tokens trong `SharedPreferences` (dùng `SecureStorage`)
4. Trust user input mà không validate

### ✅ BẮT BUỘC

1. Tokens lưu trong `flutter_secure_storage`
2. Validate input ở client trước khi gửi
3. Handle 401 → refresh token hoặc logout
4. HTTPS trong production

## Troubleshooting

### Lỗi: "Connection refused" khi gọi localhost

**Android Emulator:**
```dart
// Dùng 10.0.2.2 thay vì localhost
static const String baseUrl = 'http://10.0.2.2:8080';
```

**iOS Simulator:**
```dart
static const String baseUrl = 'http://localhost:8080';
```

### Lỗi code generation

```bash
# Clean và build lại
flutter pub run build_runner clean
flutter pub run build_runner build --delete-conflicting-outputs
```

### Lỗi "part of" không tìm thấy

File `*.freezed.dart` và `*.g.dart` chưa generate. Chạy:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## API Endpoints

Xem đầy đủ: `../sightlight-PRM393-develope/docs/sa/api-spec.md`

**Auth:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

**User:**
- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`

**Content:**
- `GET /api/v1/courses`
- `GET /api/v1/courses/{id}/path`
- `GET /api/v1/lessons/{id}`
- `POST /api/v1/lessons/{id}/complete`

**Dictionary:**
- `GET /api/v1/dictionary/search?q={query}`
- `GET /api/v1/dictionary/signs/{id}`

## License

Private project.
