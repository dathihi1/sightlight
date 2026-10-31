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
  });

  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final bool isPremium;

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: (json['displayName'] ?? json['name'] ?? json['fullName'])
          as String?,
      avatarUrl: (json['avatarUrl'] ?? json['picture'] ?? json['avatar'])
          as String?,
      isPremium: json['isPremium'] as bool? ?? false,
    );
  }
}
