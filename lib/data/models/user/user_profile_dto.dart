import '../../../domain/entities/user_profile.dart';

class UserProfileDto {
  const UserProfileDto({
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

  factory UserProfileDto.fromJson(Map<String, dynamic> json) {
    // Check if result has nested 'profile' object or is flat
    final profileMap = json['profile'] is Map<String, dynamic>
        ? json['profile'] as Map<String, dynamic>
        : json;

    final preferencesMap = json['preferences'] is Map<String, dynamic>
        ? json['preferences'] as Map<String, dynamic>
        : <String, dynamic>{};

    final rolesList = (json['roles'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final isPrem =
        (json['isPremium'] as bool?) ??
        (profileMap['isPremium'] as bool?) ??
        rolesList.any((r) => r.toUpperCase().contains('PREMIUM'));

    return UserProfileDto(
      userId: (json['userId'] ?? json['id'] ?? '') as String,
      email: (profileMap['email'] ?? json['email'] ?? '') as String,
      displayName:
          (profileMap['displayName'] ?? json['displayName'] ?? json['name'])
              as String?,
      avatarUrl: (profileMap['avatarUrl'] ?? json['avatarUrl']) as String?,
      timezone: (profileMap['timezone'] ?? json['timezone']) as String?,
      isPremium: isPrem,
      emailVerified:
          (json['emailVerified'] as bool?) ??
          (profileMap['emailVerified'] as bool?) ??
          false,
      roles: rolesList,
      preferences: UserPreferences.fromJson(preferencesMap),
    );
  }

  UserProfile toEntity() {
    return UserProfile(
      userId: userId,
      email: email,
      displayName: displayName,
      avatarUrl: avatarUrl,
      timezone: timezone,
      isPremium: isPremium,
      emailVerified: emailVerified,
      roles: roles,
      preferences: preferences,
    );
  }
}
