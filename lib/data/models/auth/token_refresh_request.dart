import 'package:uuid/uuid.dart';

class TokenRefreshRequest {
  const TokenRefreshRequest({
    required this.requestId,
    required this.refreshToken,
    this.version = '1.0',
  });

  final String requestId;
  final String refreshToken;
  final String version;

  factory TokenRefreshRequest.create({required String refreshToken}) {
    return TokenRefreshRequest(
      requestId: const Uuid().v4(),
      refreshToken: refreshToken,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      'refreshToken': refreshToken,
      'version': version,
    };
  }
}
