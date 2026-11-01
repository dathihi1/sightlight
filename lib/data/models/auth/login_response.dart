class LoginResponse {
  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    this.roles = const [],
    this.activeCourseId,
    this.requiresEmailVerification = false,
    this.pendingDeletion = false,
    this.user,
  });

  final String accessToken;
  final String refreshToken;
  final String userId;
  final List<String> roles;
  final String? activeCourseId;
  final bool requiresEmailVerification;
  final bool pendingDeletion;
  final UserInfo? user;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'] as List<dynamic>?;
    return LoginResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      userId:
          json['userId'] as String? ??
          (json['user'] != null
              ? (json['user'] as Map<String, dynamic>)['id'] as String? ?? ''
              : ''),
      roles: rawRoles?.map((e) => e.toString()).toList() ?? const [],
      activeCourseId: json['activeCourseId'] as String?,
      requiresEmailVerification:
          json['requiresEmailVerification'] as bool? ?? false,
      pendingDeletion: json['pendingDeletion'] as bool? ?? false,
      user: json['user'] != null
          ? UserInfo.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}

class UserInfo {
  const UserInfo({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.isPremium = false,
    this.roles = const [],
    this.activeCourseId,
    this.emailVerified = false,
  });

  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final bool isPremium;
  final List<String> roles;
  final String? activeCourseId;
  final bool emailVerified;

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] is Map<String, dynamic>
        ? json['profile'] as Map<String, dynamic>
        : json;
    final roles =
        (json['roles'] as List<dynamic>?)
            ?.map((role) => role.toString())
            .toList() ??
        const <String>[];
    final preferences = json['preferences'] is Map<String, dynamic>
        ? json['preferences'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return UserInfo(
      id: (json['userId'] ?? json['id'] ?? '').toString(),
      email: (profile['email'] ?? json['email'] ?? '').toString(),
      displayName: (profile['displayName'] ?? json['name'] ?? json['fullName'])
          ?.toString(),
      avatarUrl: (profile['avatarUrl'] ?? json['picture'] ?? json['avatar'])
          ?.toString(),
      isPremium:
          (json['isPremium'] as bool?) ??
          roles.any((role) => role.toUpperCase().contains('PREMIUM')),
      roles: roles,
      activeCourseId: (preferences['activeCourseId'] ?? json['activeCourseId'])
          ?.toString(),
      emailVerified: json['emailVerified'] as bool? ?? false,
    );
  }
}
