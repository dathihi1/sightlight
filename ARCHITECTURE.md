## Project Structure

```
lib/
├── core/
│   ├── constants/
│   │   ├── api_constants.dart          # API endpoints
│   │   └── storage_keys.dart           # Storage keys
│   ├── network/
│   │   ├── dio_client.dart             # Dio setup
│   │   └── interceptors/
│   │       ├── auth_interceptor.dart   # Auto-inject Bearer token
│   │       └── logging_interceptor.dart
│   └── storage/
│       └── token_storage.dart          # SecureStorage wrapper
├── data/
│   ├── datasources/
│   │   └── auth_remote_datasource.dart # API calls
│   ├── models/
│   │   ├── transaction_response.dart   # Backend envelope
│   │   └── auth/
│   │       ├── login_request.dart
│   │       ├── login_response.dart
│   │       └── register_request.dart
│   └── repositories/
│       └── auth_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── user.dart                   # Pure domain model
│   └── repositories/
│       └── auth_repository.dart        # Interface
├── presentation/
│   ├── pages/
│   │   └── login_page.dart
│   ├── providers/
│   │   └── auth_provider.dart          # Riverpod state
│   └── widgets/
└── main.dart
```

## Thêm endpoint mới

### 1. Thêm constant

`lib/core/constants/api_constants.dart`:
```dart
static const String courses = '$apiPrefix/courses';
```

### 2. Tạo model

`lib/data/models/course/course_response.dart`:
```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'course_response.freezed.dart';
part 'course_response.g.dart';

@freezed
class CourseResponse with _$CourseResponse {
  const factory CourseResponse({
    required String id,
    required String title,
    required bool isFree,
  }) = _CourseResponse;

  factory CourseResponse.fromJson(Map<String, dynamic> json) =>
      _$CourseResponseFromJson(json);
}
```

### 3. Tạo datasource

`lib/data/datasources/course_remote_datasource.dart`:
```dart
class CourseRemoteDataSource {
  CourseRemoteDataSource(this._dio);
  final Dio _dio;

  Future<TransactionResponse<List<CourseResponse>>> getCourses() async {
    final response = await _dio.get(ApiConstants.courses);
    
    return TransactionResponse<List<CourseResponse>>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => (json as List)
          .map((e) => CourseResponse.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
```

### 4. Generate code

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 5. Tạo provider

`lib/presentation/providers/course_provider.dart`:
```dart
final coursesProvider = FutureProvider<List<Course>>((ref) async {
  final repository = ref.watch(courseRepositoryProvider);
  return repository.getCourses();
});
```

### 6. Dùng trong UI

```dart
class CoursesPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);
    
    return coursesAsync.when(
      data: (courses) => ListView.builder(
        itemCount: courses.length,
        itemBuilder: (context, index) => CourseCard(courses[index]),
      ),
      loading: () => const CircularProgressIndicator(),
      error: (error, _) => Text('Error: $error'),
    );
  }
}
```
