/// API configuration constants
class ApiConstants {
  // Base URLs
  static const String devBaseUrl = 'http://localhost:8080';
  static const String uatBaseUrl = 'https://uat.signlight.local';
  static const String prodBaseUrl =
      'https://signlight-api.thankfulocean-a6c2129d.eastasia.azurecontainerapps.io';

  // Current environment
  static const String baseUrl = prodBaseUrl;
  static const String apiPrefix = '/api/v1';

  // Endpoints
  static const String health = '/health';

  // Auth
  static const String register = '$apiPrefix/auth/register';
  static const String login = '$apiPrefix/auth/login';
  static const String refresh = '$apiPrefix/auth/refresh';
  static const String logout = '$apiPrefix/auth/logout';
  static const String googleAuth = '$apiPrefix/auth/google';
  static const String forgotPassword = '$apiPrefix/auth/password/forgot';
  static const String resetPassword = '$apiPrefix/auth/password/reset';

  // User
  static const String me = '$apiPrefix/me';
  static const String updateProfile = '$apiPrefix/me/profile';
  static const String updateAvatar = '$apiPrefix/me/avatar';
  static const String updatePreferences = '$apiPrefix/me/preferences';

  // Gamification & Progress
  static const String progressOverview = '$apiPrefix/progress/overview';
  static const String progressActivity = '$apiPrefix/progress/activity';
  static const String awards = '$apiPrefix/awards';
  static String awardCelebrated(String code) => '$apiPrefix/awards/$code/celebrated';
  static const String gamificationSummary = '$apiPrefix/gamification/summary';
  static const String gamificationStore = '$apiPrefix/gamification/store';
  static const String gamificationRedeem = '$apiPrefix/gamification/store/redeem';

  // Billing & Payment (payOS)
  static const String checkout = '$apiPrefix/billing/checkout';
  static const String billingPlans = '$apiPrefix/billing/plans';
  static String billingVerify(String orderCode) => '$apiPrefix/billing/verify/$orderCode';

  // Courses
  static const String courses = '$apiPrefix/courses';
  static String coursePath(String courseId) => '$apiPrefix/courses/$courseId/path';

  // Dictionary
  static const String dictionarySearch = '$apiPrefix/dictionary/search';
  static String signDetail(String signId) => '$apiPrefix/dictionary/signs/$signId';
  static const String dictionaryTopics = '$apiPrefix/dictionary/topics';

  // Practice
  static const String vocabularySession = '$apiPrefix/practice/vocabulary/session';
  static const String vocabularyAnswer = '$apiPrefix/practice/vocabulary/answer';
  static const String fingerspellSession = '$apiPrefix/practice/fingerspell/session';
  static const String fingerspellAttempt = '$apiPrefix/practice/fingerspell/attempt';
  static const String numbersSession = '$apiPrefix/practice/numbers/session';
  static const String aiPracticeSession = '$apiPrefix/ai/practice/session';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
