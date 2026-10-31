class RegisterResponse {
  const RegisterResponse({
    required this.userId,
    required this.accessToken,
    required this.refreshToken,
    required this.status,
    this.activeCourseId,
  });

  final String userId;
  final String accessToken;
  final String refreshToken;
  final String status;
  final String? activeCourseId;

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      userId: json['userId'] as String? ?? '',
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      status: json['status'] as String? ?? '',
      activeCourseId: json['activeCourseId'] as String?,
    );
  }
}
