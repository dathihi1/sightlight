import 'dart:developer' as developer;

import 'package:dio/dio.dart';

/// Metadata-only HTTP logging. Query strings, headers, bodies, and response
/// payloads are intentionally excluded because they can contain credentials or
/// personal data.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log('→ ${options.method} ${options.path}', name: 'Dio');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '← ${response.statusCode} ${response.requestOptions.path}',
      name: 'Dio',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '✗ ${err.requestOptions.method} ${err.requestOptions.path} '
      '(${err.response?.statusCode ?? err.type.name})',
      name: 'Dio',
    );
    handler.next(err);
  }
}
