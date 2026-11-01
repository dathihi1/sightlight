import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_remote_datasource.dart';

class UserRepositoryImpl implements UserRepository {
  UserRepositoryImpl(this._remoteDataSource);

  final UserRemoteDataSource _remoteDataSource;

  UserProfile? _cachedProfile;

  @override
  Future<UserProfile> getProfile() async {
    final response = await _remoteDataSource.getProfile();
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể tải hồ sơ');
    }
    _cachedProfile = response.result!.toEntity();
    return _cachedProfile!;
  }

  @override
  Future<UserProfile> updateProfile({
    String? displayName,
    String? timezone,
  }) async {
    final response = await _remoteDataSource.updateProfile(
      displayName: displayName,
      timezone: timezone,
    );
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể cập nhật hồ sơ');
    }
    _cachedProfile = response.result!.toEntity();
    return _cachedProfile!;
  }

  @override
  Future<String> updateAvatar(String filePath) async {
    final response = await _remoteDataSource.updateAvatar(filePath);
    if (response.isError || response.result == null) {
      throw Exception(
        response.errorMessage ?? 'Không thể cập nhật ảnh đại diện',
      );
    }
    final newUrl = response.result!;
    if (_cachedProfile != null) {
      _cachedProfile = _cachedProfile!.copyWith(avatarUrl: newUrl);
    }
    return newUrl;
  }

  @override
  Future<UserPreferences> updatePreferences(UserPreferences preferences) async {
    final response = await _remoteDataSource.updatePreferences(preferences);
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể cập nhật cài đặt');
    }
    if (_cachedProfile != null) {
      _cachedProfile = _cachedProfile!.copyWith(preferences: response.result!);
    }
    return response.result!;
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    final response = await _remoteDataSource.forgotPassword(email);
    if (response.isError) {
      throw Exception(response.errorMessage ?? 'Không thể gửi yêu cầu');
    }
  }
}
