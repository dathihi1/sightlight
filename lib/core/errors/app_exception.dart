import 'package:dio/dio.dart';

sealed class AppException implements Exception {
  const AppException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => message;

  factory AppException.fromDio(DioException error) {
    if (error.error is AppException) {
      return error.error! as AppException;
    }
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkException(
          'Kết nối đến máy chủ quá thời gian. Vui lòng thử lại.',
          code: 'TIMEOUT',
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        String? serverMsg;
        String? serverCode;
        if (data is Map<String, dynamic>) {
          serverMsg = (data['errorMessage'] ?? data['message']) as String?;
          serverCode = data['errorCode']?.toString();
        }

        if (statusCode == 401) {
          return AuthException(
            serverMsg ?? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            code: serverCode ?? 'UNAUTHORIZED',
          );
        } else if (statusCode == 403) {
          return AuthException(
            serverMsg ?? 'Bạn không có quyền truy cập tính năng này.',
            code: serverCode ?? 'FORBIDDEN',
          );
        } else if (statusCode == 404) {
          return ServerException(
            serverMsg ?? 'Không tìm thấy dữ liệu yêu cầu.',
            code: serverCode ?? 'NOT_FOUND',
          );
        } else if (statusCode != null && statusCode >= 500) {
          return ServerException(
            serverMsg ?? 'Hệ thống máy chủ đang bận. Vui lòng thử lại sau.',
            code: serverCode ?? 'SERVER_ERROR',
          );
        }
        return ServerException(
          serverMsg ?? 'Yêu cầu không hợp lệ ($statusCode).',
          code: serverCode ?? 'BAD_REQUEST',
        );

      case DioExceptionType.connectionError:
        return const NetworkException(
          'Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi hoặc 4G/5G.',
          code: 'NO_CONNECTION',
        );

      case DioExceptionType.cancel:
        return const ServerException('Thao tác đã bị hủy.', code: 'CANCEL');

      case DioExceptionType.badCertificate:
        return const NetworkException(
          'Lỗi chứng chỉ bảo mật mạng.',
          code: 'BAD_CERT',
        );

      case DioExceptionType.unknown:
      default:
        return NetworkException(
          error.message ?? 'Đã xảy ra lỗi mạng không xác định.',
          code: 'UNKNOWN_NETWORK',
        );
    }
  }
}

class NetworkException extends AppException {
  const NetworkException(super.message, {super.code});
}

class ServerException extends AppException {
  const ServerException(super.message, {super.code});
}

class BusinessException extends AppException {
  const BusinessException(super.message, {required super.code});
}

class AuthException extends AppException {
  const AuthException(super.message, {super.code});
}

class PaymentException extends AppException {
  const PaymentException(super.message, {super.code});
}
