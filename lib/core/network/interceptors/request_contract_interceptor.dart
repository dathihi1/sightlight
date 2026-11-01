import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../../constants/api_constants.dart';
import '../../errors/app_exception.dart';

/// Applies the shared SignLight request/response contract to every API call.
class RequestContractInterceptor extends Interceptor {
  const RequestContractInterceptor();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final requestId = const Uuid().v4();
    options.headers.putIfAbsent(ApiConstants.requestIdHeader, () => requestId);

    final data = options.data;
    if (data is Map<String, dynamic>) {
      data.putIfAbsent('requestId', () => requestId);
      data.putIfAbsent('version', () => ApiConstants.apiVersion);
    }

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    final data = response.data;
    final expectsEnvelope = response.requestOptions.path.startsWith('/api/v1/');
    if (expectsEnvelope &&
        (data is! Map<String, dynamic> || !data.containsKey('errorCode'))) {
      return handler.reject(
        DioException(
          requestOptions: response.requestOptions,
          response: response,
          type: DioExceptionType.badResponse,
          error: const ServerException(
            'Phản hồi máy chủ không đúng định dạng.',
            code: '00499',
          ),
        ),
      );
    }
    if (data is Map<String, dynamic> && data.containsKey('errorCode')) {
      final code = data['errorCode']?.toString() ?? '00499';
      if (code != '00000') {
        final message = data['errorMessage']?.toString().trim();
        return handler.reject(
          DioException(
            requestOptions: response.requestOptions,
            response: response,
            type: DioExceptionType.badResponse,
            error: BusinessException(
              message?.isNotEmpty == true
                  ? message!
                  : 'Yêu cầu không thành công. Vui lòng thử lại.',
              code: code,
            ),
          ),
        );
      }
    }

    handler.next(response);
  }
}
