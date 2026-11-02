/// API configuration constants
class ApiConstants {
  // Base URLs
  static const String devBaseUrl = 'http://localhost:8080';
  static const String stagingBaseUrl = 'https://uat.signlight.local';
  @Deprecated('Use stagingBaseUrl')
  static const String uatBaseUrl = stagingBaseUrl;
  static const String prodBaseUrl =
      'https://signlight-api.thankfulocean-a6c2129d.eastasia.azurecontainerapps.io';
  static const String prodVideoProcessingBaseUrl =
      'https://signlight-video-processing.thankfulocean-a6c2129d.eastasia.azurecontainerapps.io';

  // Current environment
  // Override per build with:
  // --dart-define=API_BASE_URL=https://api.example.com
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: prodBaseUrl,
  );
  static const String videoProcessingBaseUrl = String.fromEnvironment(
    'VIDEO_PROCESSING_BASE_URL',
    defaultValue: prodVideoProcessingBaseUrl,
  );
  static const bool serverVideoEnabled = bool.fromEnvironment(
    'SERVER_VIDEO_ENABLED',
    defaultValue: true,
  );
  static bool get useServerVideoProcessing =>
      serverVideoEnabled && videoProcessingBaseUrl.trim().isNotEmpty;
  static String get videoInference =>
      '${videoProcessingBaseUrl.replaceAll(RegExp(r'/$'), '')}/v1/video/infer';
  static const String apiVersion = '1.0';
  static const String requestIdHeader = 'X-Request-Id';
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
  static String awardCelebrated(String code) =>
      '$apiPrefix/awards/$code/celebrated';
  static const String gamificationSummary = '$apiPrefix/gamification/summary';
  static const String gamificationStore = '$apiPrefix/gamification/store';
  static const String gamificationRedeem =
      '$apiPrefix/gamification/store/redeem';

  // Billing & Payment (payOS)
  static const String checkout = '$apiPrefix/billing/checkout';
  static const String billingPlans = '$apiPrefix/billing/plans';
  static String billingStatus(String orderCode) =>
      '$apiPrefix/billing/status/$orderCode';
  static String billingConfirm(String orderCode) =>
      '$apiPrefix/billing/confirm/$orderCode';

  // Referral
  static const String referralSummary = '$apiPrefix/referral/summary';
  static const String referralClaimCode = '$apiPrefix/referral/claim-code';
  static const String referralClaimReward = '$apiPrefix/referral/claim-reward';

  // Courses
  static const String courses = '$apiPrefix/courses';
  static String coursePath(String courseId) =>
      '$apiPrefix/courses/$courseId/path';
  static String lesson(String lessonId) => '$apiPrefix/lessons/$lessonId';
  static String lessonAnswer(String lessonId, String exerciseId) =>
      '$apiPrefix/lessons/$lessonId/exercises/$exerciseId/answer';
  static String completeLesson(String lessonId) =>
      '$apiPrefix/lessons/$lessonId/complete';

  // Dictionary
  static const String dictionarySearch = '$apiPrefix/dictionary/search';
  static String signDetail(String signId) =>
      '$apiPrefix/dictionary/signs/$signId';
  static const String dictionaryTopics = '$apiPrefix/dictionary/topics';

  // Practice
  static const String vocabularySession =
      '$apiPrefix/practice/vocabulary/session';
  static const String vocabularyAnswer =
      '$apiPrefix/practice/vocabulary/answer';
  static const String fingerspellSession =
      '$apiPrefix/practice/fingerspell/session';
  static const String fingerspellAttempt =
      '$apiPrefix/practice/fingerspell/attempt';
  static const String numbersSession = '$apiPrefix/practice/numbers/session';
  static const String aiPracticeSession = '$apiPrefix/ai/practice/session';
  static const String aiAttempts = '$apiPrefix/ai/attempts';
  static const String aiQuota = '$apiPrefix/ai/quota';
  static const String aiCapabilities = '$apiPrefix/ai/capabilities';

  // Timeouts
  // Azure Container Apps đang scale-to-zero để giữ chi phí thấp. Spring Boot
  // cần khoảng 45 giây để khởi động lạnh, vì vậy timeout kết nối 30 giây làm
  // lần đăng nhập đầu tiên và lượt gửi video đầu tiên thất bại dù server khỏe.
  static const Duration connectTimeout = Duration(seconds: 75);
  static const Duration receiveTimeout = Duration(seconds: 150);
  static const Duration sendTimeout = Duration(seconds: 90);
}
