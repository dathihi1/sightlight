import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/transaction_response.dart';
import '../models/user/user_profile_dto.dart';
import '../../domain/entities/user_profile.dart';

class UserRemoteDataSource {
  UserRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<UserProfileDto>> getProfile() async {
    final response = await _dio.get(ApiConstants.me);

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<UserProfileDto>.fromJson(
      data,
      (json) => UserProfileDto.fromJson(json as Map<String, dynamic>),
    );
  }

  Future<TransactionResponse<UserProfileDto>> updateProfile({
    String? displayName,
    String? timezone,
  }) async {
    final response = await _dio.patch(
      ApiConstants.updateProfile,
      data: {
        'displayName': ?displayName,
        'timezone': ?timezone,
      },
    );

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<UserProfileDto>.fromJson(
      data,
      (json) => UserProfileDto.fromJson(
        json is Map<String, dynamic> ? json : <String, dynamic>{},
      ),
    );
  }

  Future<TransactionResponse<String>> updateAvatar(String filePath) async {
    final fileName = filePath.split(RegExp(r'[\\/]')).last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        filePath,
        filename: fileName,
      ),
    });

    final response = await _dio.put(
      ApiConstants.updateAvatar,
      data: formData,
      options: Options(
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      ),
    );

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<String>.fromJson(
      data,
      (json) => (json is Map ? json['avatarUrl'] : json?.toString()) ?? '',
    );
  }

  Future<TransactionResponse<UserPreferences>> updatePreferences(
    UserPreferences preferences,
  ) async {
    final response = await _dio.patch(
      ApiConstants.updatePreferences,
      data: preferences.toJson(),
    );

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<UserPreferences>.fromJson(
      data,
      (json) => UserPreferences.fromJson(
        json is Map<String, dynamic> ? json : preferences.toJson(),
      ),
    );
  }

  Future<TransactionResponse<void>> forgotPassword(String email) async {
    final response = await _dio.post(
      ApiConstants.forgotPassword,
      data: {'email': email},
    );

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};

    return TransactionResponse<void>.fromJson(data, (_) {});
  }
}
