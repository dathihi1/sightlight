import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/api_constants.dart';
import '../storage/token_storage.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

final authInterceptorProvider = Provider<AuthInterceptor>((ref) {
  final tokenStorage = ref.watch(tokenStorageProvider);
  return AuthInterceptor(
    tokenStorage,
    onUnauthorized: () async {
      await tokenStorage.clearTokens();
    },
  );
});

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiConstants.baseUrl,
    connectTimeout: ApiConstants.connectTimeout,
    receiveTimeout: ApiConstants.receiveTimeout,
    sendTimeout: ApiConstants.sendTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'vi',
    },
  ));

  final authInterceptor = ref.watch(authInterceptorProvider);

  dio.interceptors.addAll([
    authInterceptor,
    LoggingInterceptor(),
  ]);

  return dio;
});
