/// Storage keys for SharedPreferences and SecureStorage
class StorageKeys {
  // Secure Storage (tokens, sensitive data)
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';

  // SharedPreferences (non-sensitive)
  static const String userId = 'user_id';
  static const String userEmail = 'user_email';
  static const String isLoggedIn = 'is_logged_in';
  static const String languageCode = 'language_code';
  static const String themeMode = 'theme_mode';
  static const String searchHistory = 'search_history';
  static const String favoriteSigns = 'favorite_signs';
  static const String practiceStats = 'practice_stats';
}
