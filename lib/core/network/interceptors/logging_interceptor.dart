import 'dart:developer' as developer;
import 'package:dio/dio.dart';

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log('→ ${options.method} ${options.uri}', name: 'Dio');
    developer.log('  Headers: ${options.headers}', name: 'Dio');
    if (options.data != null) {
      developer.log('  Body: ${options.data}', name: 'Dio');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log('← ${response.statusCode} ${response.requestOptions.uri}', name: 'Dio');
    developer.log('  Response: ${response.data}', name: 'Dio');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log('✗ ${err.requestOptions.method} ${err.requestOptions.uri}', name: 'Dio');
    developer.log('  Error: ${err.message}', name: 'Dio');
    if (err.response != null) {
      developer.log('  Response: ${err.response?.data}', name: 'Dio');
    }
    handler.next(err);
  }
}
