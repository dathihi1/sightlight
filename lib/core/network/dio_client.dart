import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_constants.dart';
import '../storage/token_storage.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/logging_interceptor.dart';
import 'interceptors/request_contract_interceptor.dart';
import 'interceptors/safe_retry_interceptor.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: ApiConstants.connectTimeout,
      receiveTimeout: ApiConstants.receiveTimeout,
      sendTimeout: ApiConstants.sendTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'vi',
      },
    ),
  );

  final tokenStorage = ref.watch(tokenStorageProvider);
  final authInterceptor = AuthInterceptor(tokenStorage, dio);

  dio.interceptors.addAll([
    const RequestContractInterceptor(),
    authInterceptor,
    SafeRetryInterceptor(dio),
    LoggingInterceptor(),
  ]);

  return dio;
});
