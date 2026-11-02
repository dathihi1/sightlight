import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/core/errors/app_exception.dart';
import 'package:sightlight_flutter/core/storage/token_storage.dart';
import 'package:sightlight_flutter/data/models/auth/register_response.dart';
import 'package:sightlight_flutter/domain/entities/user.dart';
import 'package:sightlight_flutter/domain/repositories/auth_repository.dart';
import 'package:sightlight_flutter/presentation/providers/auth_provider.dart';

void main() {
  test(
    'login converts Dio connection failures into a readable error',
    () async {
      final notifier = AuthNotifier(_FailingAuthRepository(), TokenStorage());
      addTearDown(notifier.dispose);

      await expectLater(
        notifier.login('user@example.com', 'password123'),
        throwsA(
          isA<NetworkException>().having(
            (error) => error.toString(),
            'message',
            contains('Wi-Fi hoặc 4G/5G'),
          ),
        ),
      );
    },
  );
}

class _FailingAuthRepository implements AuthRepository {
  @override
  Future<User> login(String email, String password) {
    final options = RequestOptions(path: '/api/v1/auth/login');
    throw DioException.connectionError(
      requestOptions: options,
      reason: 'offline',
    );
  }

  @override
  Future<User?> getCurrentUser() async => null;

  @override
  Future<RegisterResponse> register(
    String email,
    String password,
    String displayName,
  ) => throw UnimplementedError();

  @override
  Future<User> loginWithGoogle(String idToken) => throw UnimplementedError();

  @override
  Future<void> forgotPassword(String email) => throw UnimplementedError();

  @override
  Future<bool> isLoggedIn() async => false;

  @override
  Future<void> logout() async {}
}
