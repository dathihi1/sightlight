import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../models/auth/forgot_password_request.dart';
import '../models/auth/google_login_request.dart';
import '../models/auth/login_request.dart';
import '../models/auth/login_response.dart';
import '../models/auth/register_request.dart';
import '../models/auth/register_response.dart';
import '../models/auth/token_refresh_request.dart';
import '../models/auth/token_refresh_response.dart';
import '../models/transaction_response.dart';

class AuthRemoteDataSource {
  const AuthRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<LoginResponse>> login(LoginRequest request) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: request.toJson(),
    );

    return TransactionResponse<LoginResponse>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => LoginResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<RegisterResponse>> register(
    RegisterRequest request,
  ) async {
    final response = await _dio.post(
      ApiConstants.register,
      data: request.toJson(),
    );

    return TransactionResponse<RegisterResponse>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => RegisterResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<LoginResponse>> googleLogin(
    GoogleLoginRequest request,
  ) async {
    final response = await _dio.post(
      ApiConstants.googleAuth,
      data: request.toJson(),
    );

    return TransactionResponse<LoginResponse>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => LoginResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<void>> forgotPassword(
    ForgotPasswordRequest request,
  ) async {
    final response = await _dio.post(
      ApiConstants.forgotPassword,
      data: request.toJson(),
    );

    return TransactionResponse<void>.fromJson(
      response.data as Map<String, dynamic>,
      (_) {},
    );
  }

  Future<TransactionResponse<TokenRefreshResponse>> refreshToken(
    TokenRefreshRequest request,
  ) async {
    final response = await _dio.post(
      ApiConstants.refresh,
      data: request.toJson(),
    );

    return TransactionResponse<TokenRefreshResponse>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => TokenRefreshResponse.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<void>> logout(TokenRefreshRequest request) async {
    final response = await _dio.post(
      ApiConstants.logout,
      data: request.toJson(),
    );

    return TransactionResponse<void>.fromJson(
      response.data as Map<String, dynamic>,
      (_) {},
    );
  }

  Future<TransactionResponse<UserInfo>> getMe() async {
    final response = await _dio.get(ApiConstants.me);

    return TransactionResponse<UserInfo>.fromJson(
      response.data as Map<String, dynamic>,
      (json) => UserInfo.fromJson(json as Map<String, dynamic>),
    );
  }
}
