import 'package:uuid/uuid.dart';

class ForgotPasswordRequest {
  const ForgotPasswordRequest({
    required this.requestId,
    required this.email,
    this.version = '1.0',
  });

  final String requestId;
  final String email;
  final String version;

  factory ForgotPasswordRequest.create({required String email}) {
    return ForgotPasswordRequest(requestId: const Uuid().v4(), email: email);
  }

  Map<String, dynamic> toJson() {
    return {'requestId': requestId, 'email': email, 'version': version};
  }
}
