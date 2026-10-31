class TokenRefreshResponse {
  const TokenRefreshResponse({
    required this.accessToken,
    required this.refreshToken,
    this.expiresInSeconds,
  });

  final String accessToken;
  final String refreshToken;
  final int? expiresInSeconds;

  factory TokenRefreshResponse.fromJson(Map<String, dynamic> json) {
    return TokenRefreshResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      expiresInSeconds: json['expiresInSeconds'] as int?,
    );
  }
}
