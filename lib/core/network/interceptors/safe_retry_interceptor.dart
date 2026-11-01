import 'package:dio/dio.dart';

/// Retries a transient failure once, and only for idempotent requests.
class SafeRetryInterceptor extends Interceptor {
  SafeRetryInterceptor(this._dio);

  final Dio _dio;

  static const _retryCountKey = 'safeRetryCount';
  static const _idempotentMethods = {'GET', 'HEAD', 'OPTIONS'};

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    final retryCount = options.extra[_retryCountKey] as int? ?? 0;
    if (retryCount >= 1 || !_idempotentMethods.contains(options.method)) {
      return handler.next(err);
    }

    final status = err.response?.statusCode;
    final transient =
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError ||
        status == 502 ||
        status == 503 ||
        status == 504;
    if (!transient) return handler.next(err);

    options.extra[_retryCountKey] = retryCount + 1;
    try {
      final response = await _dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }
}
