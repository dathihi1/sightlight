import '../entities/user_profile.dart';

abstract interface class UserRepository {
  Future<UserProfile> getProfile();
  Future<UserProfile> updateProfile({String? displayName, String? timezone});
  Future<String> updateAvatar(String filePath);
  Future<UserPreferences> updatePreferences(UserPreferences preferences);
  Future<void> requestPasswordReset(String email);
}
