import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../../constants/api_constants.dart';
import '../../storage/token_storage.dart';

class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor(this._tokenStorage, {this.onUnauthorized});

  final TokenStorage _tokenStorage;
  final void Function()? onUnauthorized;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final path = options.path;
    final isPublicEndpoint =
        path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/google') ||
        path.contains('/auth/password/');

    if (!isPublicEndpoint) {
      final token = await _tokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      return handler.next(err);
    }

    final path = err.requestOptions.path;
    final isAuthEndpoint =
        path.contains('/auth/login') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/register') ||
        path.contains('/auth/google');

    if (isAuthEndpoint) {
      return handler.next(err);
    }

    final refreshToken = await _tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _tokenStorage.clearTokens();
      onUnauthorized?.call();
      return handler.next(err);
    }

    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          connectTimeout: ApiConstants.connectTimeout,
          receiveTimeout: ApiConstants.receiveTimeout,
          sendTimeout: ApiConstants.sendTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      final refreshResponse = await refreshDio.post(
        ApiConstants.refresh,
        data: {
          'requestId': const Uuid().v4(),
          'version': '1.0',
          'refreshToken': refreshToken,
        },
      );

      final data = refreshResponse.data as Map<String, dynamic>;
      final errorCode = data['errorCode'] as String?;
      final result = data['result'] as Map<String, dynamic>?;

      if (errorCode == '00000' && result != null) {
        final newAccessToken = result['accessToken'] as String;
        final newRefreshToken =
            (result['refreshToken'] as String?) ?? refreshToken;

        await _tokenStorage.saveAccessToken(newAccessToken);
        await _tokenStorage.saveRefreshToken(newRefreshToken);

        // Retry original request
        final retryOptions = err.requestOptions;
        retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

        final retryResponse = await refreshDio.fetch(retryOptions);
        return handler.resolve(retryResponse);
      } else {
        await _tokenStorage.clearTokens();
        onUnauthorized?.call();
        return handler.next(err);
      }
    } catch (_) {
      await _tokenStorage.clearTokens();
      onUnauthorized?.call();
      return handler.next(err);
    }
  }
}
