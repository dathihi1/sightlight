import 'package:dio/dio.dart';

import '../../constants/api_constants.dart';
import '../../storage/token_storage.dart';
import 'request_contract_interceptor.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenStorage, this._dio, {this.refreshClientFactory});

  final TokenStorage _tokenStorage;
  final Dio _dio;
  final Dio Function()? refreshClientFactory;
  Future<_RefreshedTokens?>? _refreshFuture;

  static const _authRetriedKey = 'authRetried';

  bool _isPublic(String path) {
    return path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/google') ||
        path.contains('/auth/email/') ||
        path.contains('/auth/password/');
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_isPublic(options.path)) {
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
    final options = err.requestOptions;
    if (err.response?.statusCode != 401 ||
        _isPublic(options.path) ||
        options.extra[_authRetriedKey] == true) {
      return handler.next(err);
    }

    final refreshToken = await _tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _expireSession();
      return handler.next(err);
    }

    // Reuse a token already refreshed by another failed request.
    final requestToken = _bearerToken(options.headers['Authorization']);
    final currentToken = await _tokenStorage.getAccessToken();
    if (currentToken != null &&
        currentToken.isNotEmpty &&
        requestToken != null &&
        currentToken != requestToken) {
      return _retry(options, currentToken, handler, err);
    }

    try {
      final future = _refreshFuture ??= _refresh(refreshToken);
      final tokens = await future;
      if (identical(_refreshFuture, future)) _refreshFuture = null;

      if (tokens == null) {
        await _expireSession();
        return handler.next(err);
      }
      await _retry(options, tokens.accessToken, handler, err);
      return;
    } catch (_) {
      _refreshFuture = null;
      await _expireSession();
      return handler.next(err);
    }
  }

  Future<_RefreshedTokens?> _refresh(String refreshToken) async {
    final client =
        refreshClientFactory?.call() ??
        Dio(
          BaseOptions(
            baseUrl: ApiConstants.baseUrl,
            connectTimeout: ApiConstants.connectTimeout,
            receiveTimeout: ApiConstants.receiveTimeout,
            sendTimeout: ApiConstants.sendTimeout,
            headers: const {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Accept-Language': 'vi',
            },
          ),
        );
    client.interceptors.add(const RequestContractInterceptor());

    final response = await client.post<Map<String, dynamic>>(
      ApiConstants.refresh,
      data: {'refreshToken': refreshToken},
    );
    final envelope = response.data;
    final result = envelope?['result'];
    if (envelope?['errorCode'] != '00000' || result is! Map<String, dynamic>) {
      return null;
    }

    final accessToken = result['accessToken']?.toString() ?? '';
    final rotatedRefreshToken = result['refreshToken']?.toString() ?? '';
    if (accessToken.isEmpty || rotatedRefreshToken.isEmpty) return null;

    await _tokenStorage.saveAccessToken(accessToken);
    await _tokenStorage.saveRefreshToken(rotatedRefreshToken);
    return _RefreshedTokens(accessToken);
  }

  Future<void> _retry(
    RequestOptions options,
    String accessToken,
    ErrorInterceptorHandler handler,
    DioException originalError,
  ) async {
    options.extra[_authRetriedKey] = true;
    options.headers['Authorization'] = 'Bearer $accessToken';
    try {
      final response = await _dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      if (retryError.response?.statusCode == 401) await _expireSession();
      handler.next(retryError);
    } catch (_) {
      handler.next(originalError);
    }
  }

  Future<void> _expireSession() => _tokenStorage.expireSession();

  String? _bearerToken(Object? value) {
    final header = value?.toString();
    if (header == null || !header.startsWith('Bearer ')) return null;
    return header.substring(7);
  }
}

class _RefreshedTokens {
  const _RefreshedTokens(this.accessToken);

  final String accessToken;
}
