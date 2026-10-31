class UserPreferences {
  const UserPreferences({
    this.activeCourseId,
    this.dailyGoalMinutes = 15,
    this.videoSpeed = '1.0',
    this.uiLocale = 'vi',
    this.notificationsEnabled = true,
  });

  final String? activeCourseId;
  final int dailyGoalMinutes;
  final String videoSpeed;
  final String uiLocale;
  final bool notificationsEnabled;

  UserPreferences copyWith({
    String? activeCourseId,
    int? dailyGoalMinutes,
    String? videoSpeed,
    String? uiLocale,
    bool? notificationsEnabled,
  }) {
    return UserPreferences(
      activeCourseId: activeCourseId ?? this.activeCourseId,
      dailyGoalMinutes: dailyGoalMinutes ?? this.dailyGoalMinutes,
      videoSpeed: videoSpeed ?? this.videoSpeed,
      uiLocale: uiLocale ?? this.uiLocale,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (activeCourseId != null) 'activeCourseId': activeCourseId,
      'dailyGoalMinutes': dailyGoalMinutes,
      'videoSpeed': videoSpeed,
      'uiLocale': uiLocale,
      'notificationsEnabled': notificationsEnabled,
    };
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      activeCourseId: json['activeCourseId'] as String?,
      dailyGoalMinutes: (json['dailyGoalMinutes'] as num?)?.toInt() ?? 15,
      videoSpeed: (json['videoSpeed'] as String?) ?? '1.0',
      uiLocale: (json['uiLocale'] as String?) ?? 'vi',
      notificationsEnabled:
          (json['notificationsEnabled'] as bool?) ??
          (json['notificationEnabled'] as bool?) ??
          true,
    );
  }
}

class UserProfile {
  const UserProfile({
    required this.userId,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.timezone,
    this.isPremium = false,
    this.emailVerified = false,
    this.roles = const [],
    this.preferences = const UserPreferences(),
  });

  final String userId;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? timezone;
  final bool isPremium;
  final bool emailVerified;
  final List<String> roles;
  final UserPreferences preferences;

  UserProfile copyWith({
    String? userId,
    String? email,
    String? displayName,
    String? avatarUrl,
    String? timezone,
    bool? isPremium,
    bool? emailVerified,
    List<String>? roles,
    UserPreferences? preferences,
  }) {
    return UserProfile(
      userId: userId ?? this.userId,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      timezone: timezone ?? this.timezone,
      isPremium: isPremium ?? this.isPremium,
      emailVerified: emailVerified ?? this.emailVerified,
      roles: roles ?? this.roles,
      preferences: preferences ?? this.preferences,
    );
  }
}
