import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/models/auth/register_response.dart';
import 'package:sightlight_flutter/domain/entities/user.dart';
import 'package:sightlight_flutter/domain/repositories/auth_repository.dart';
import 'package:sightlight_flutter/presentation/pages/forgot_password_page.dart';
import 'package:sightlight_flutter/presentation/pages/login_page.dart';
import 'package:sightlight_flutter/presentation/pages/register_page.dart';
import 'package:sightlight_flutter/presentation/providers/auth_provider.dart';

class FakeAuthRepository implements AuthRepository {
  bool registerCalled = false;
  bool loginCalled = false;
  bool forgotPasswordCalled = false;

  @override
  Future<User> login(String email, String password) async {
    loginCalled = true;
    return User(
      id: 'test-user-id',
      email: email,
      displayName: 'Test User',
      isPremium: false,
    );
  }

  @override
  Future<RegisterResponse> register(
    String email,
    String password,
    String displayName,
  ) async {
    registerCalled = true;
    return const RegisterResponse(
      userId: 'test-new-user-id',
      accessToken: 'test_token',
      refreshToken: 'test_refresh_token',
      status: 'PENDING_VERIFICATION',
    );
  }

  @override
  Future<User> loginWithGoogle(String idToken) async {
    return const User(
      id: 'google-user-id',
      email: 'google@example.com',
      displayName: 'Google User',
      isPremium: false,
    );
  }

  @override
  Future<void> forgotPassword(String email) async {
    forgotPasswordCalled = true;
  }

  @override
  Future<void> logout() async {}

  @override
  Future<User?> getCurrentUser() async => null;

  @override
  Future<bool> isLoggedIn() async => false;
}

void main() {
  group('RegisterPage Widget Tests', () {
    testWidgets('shows validation errors when fields are empty', (
      tester,
    ) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
          ],
          child: const MaterialApp(home: RegisterPage()),
        ),
      );

      // Tap Register without entering anything
      await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng ký'));
      await tester.pump();

      expect(find.text('Vui lòng nhập họ và tên'), findsOneWidget);
      expect(find.text('Vui lòng nhập email'), findsOneWidget);
      expect(find.text('Vui lòng nhập mật khẩu'), findsOneWidget);
      expect(find.text('Vui lòng xác nhận mật khẩu'), findsOneWidget);
    });

    testWidgets('validates password length and password match', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
          ],
          child: const MaterialApp(home: RegisterPage()),
        ),
      );

      // Enter display name and valid email
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Họ và tên'),
        'Nguyen Van A',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'),
        'valid@example.com',
      );

      // Short password (<6 chars)
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Mật khẩu'),
        '123',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Xác nhận mật khẩu'),
        '456',
      );

      await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng ký'));
      await tester.pump();

      expect(find.text('Mật khẩu phải có ít nhất 10 ký tự'), findsOneWidget);
      expect(find.text('Mật khẩu xác nhận không khớp'), findsOneWidget);
    });
  });

  group('LoginPage Widget Tests', () {
    testWidgets('renders all required elements', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
          ],
          child: const MaterialApp(home: LoginPage()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Đăng nhập'), findsWidgets);
      expect(find.text('Đăng nhập bằng Google'), findsOneWidget);
      expect(find.text('Quên mật khẩu?'), findsOneWidget);
      expect(find.text('Đăng ký ngay'), findsOneWidget);
    });

    testWidgets('validates empty email and password', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
          ],
          child: const MaterialApp(home: LoginPage()),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng nhập'));
      await tester.pump();

      expect(find.text('Vui lòng nhập email'), findsOneWidget);
      expect(find.text('Vui lòng nhập mật khẩu'), findsOneWidget);
    });
  });

  group('ForgotPasswordPage Widget Tests', () {
    testWidgets('validates invalid email format', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(FakeAuthRepository()),
          ],
          child: const MaterialApp(home: ForgotPasswordPage()),
        ),
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'),
        'invalid-email',
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
      await tester.pump();

      expect(find.text('Email không hợp lệ'), findsOneWidget);
    });

    testWidgets('shows success message after valid submission', (tester) async {
      final fakeRepo = FakeAuthRepository();
      await tester.pumpWidget(
        ProviderScope(
          overrides: [authRepositoryProvider.overrideWithValue(fakeRepo)],
          child: const MaterialApp(home: ForgotPasswordPage()),
        ),
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Email'),
        'hocvien@example.com',
      );
      await tester.tap(find.widgetWithText(ElevatedButton, 'Gửi yêu cầu'));
      await tester.pumpAndSettle();

      expect(fakeRepo.forgotPasswordCalled, isTrue);
      expect(find.text('Đã gửi liên kết thành công!'), findsOneWidget);
      expect(find.text('Quay về Đăng nhập'), findsOneWidget);
    });
  });
}
