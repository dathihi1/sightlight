import 'package:dio/dio.dart';
import '../../domain/entities/user_profile.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_remote_datasource.dart';

class UserRepositoryImpl implements UserRepository {
  UserRepositoryImpl(this._remoteDataSource);

  final UserRemoteDataSource _remoteDataSource;

  // Local in-memory cache for smooth optimistic UI updates
  UserProfile? _cachedProfile;

  UserProfile _getFallbackProfile() {
    return _cachedProfile ??
        const UserProfile(
          userId: 'usr-demo-01',
          email: 'learner@signlight.vn',
          displayName: 'Nguyễn Văn Học',
          avatarUrl: null,
          timezone: 'Asia/Ho_Chi_Minh',
          isPremium: true,
          emailVerified: true,
          roles: ['LEARNER', 'PREMIUM'],
          preferences: UserPreferences(
            dailyGoalMinutes: 20,
            videoSpeed: '1.0',
            uiLocale: 'vi',
            notificationsEnabled: true,
          ),
        );
  }

  @override
  Future<UserProfile> getProfile() async {
    try {
      final response = await _remoteDataSource.getProfile();
      if (response.isSuccess && response.result != null) {
        _cachedProfile = response.result!.toEntity();
        return _cachedProfile!;
      }
      return _getFallbackProfile();
    } on DioException {
      return _getFallbackProfile();
    } catch (_) {
      return _getFallbackProfile();
    }
  }

  @override
  Future<UserProfile> updateProfile({
    String? displayName,
    String? timezone,
  }) async {
    try {
      final response = await _remoteDataSource.updateProfile(
        displayName: displayName,
        timezone: timezone,
      );
      if (response.isSuccess && response.result != null) {
        _cachedProfile = response.result!.toEntity();
        return _cachedProfile!;
      }
    } on DioException {
      // In offline / demo mode, update local cache
    } catch (_) {}

    final current = _getFallbackProfile();
    _cachedProfile = current.copyWith(
      displayName: displayName ?? current.displayName,
      timezone: timezone ?? current.timezone,
    );
    return _cachedProfile!;
  }

  @override
  Future<String> updateAvatar(String filePath) async {
    try {
      final response = await _remoteDataSource.updateAvatar(filePath);
      if (response.isSuccess && response.result != null) {
        final newUrl = response.result!;
        final current = _getFallbackProfile();
        _cachedProfile = current.copyWith(avatarUrl: newUrl);
        return newUrl;
      }
    } on DioException {
      // In demo mode, treat local filePath as avatar
    } catch (_) {}

    final current = _getFallbackProfile();
    _cachedProfile = current.copyWith(avatarUrl: filePath);
    return filePath;
  }

  @override
  Future<UserPreferences> updatePreferences(
    UserPreferences preferences,
  ) async {
    try {
      final response = await _remoteDataSource.updatePreferences(preferences);
      if (response.isSuccess && response.result != null) {
        final current = _getFallbackProfile();
        _cachedProfile = current.copyWith(preferences: response.result!);
        return response.result!;
      }
    } on DioException {
      // In offline / demo mode
    } catch (_) {}

    final current = _getFallbackProfile();
    _cachedProfile = current.copyWith(preferences: preferences);
    return preferences;
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    try {
      await _remoteDataSource.forgotPassword(email);
    } catch (_) {}
  }
}
