class User {
  const User({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    required this.isPremium,
    this.roles = const [],
    this.activeCourseId,
  });

  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final bool isPremium;
  final List<String> roles;
  final String? activeCourseId;

  User copyWith({
    String? id,
    String? email,
    String? displayName,
    String? avatarUrl,
    bool? isPremium,
    List<String>? roles,
    String? activeCourseId,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isPremium: isPremium ?? this.isPremium,
      roles: roles ?? this.roles,
      activeCourseId: activeCourseId ?? this.activeCourseId,
    );
  }
}
