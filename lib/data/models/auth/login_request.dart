import 'package:uuid/uuid.dart';

class LoginRequest {
  const LoginRequest({
    required this.requestId,
    required this.email,
    required this.password,
    this.version = '1.0',
  });

  final String requestId;
  final String email;
  final String password;
  final String version;

  factory LoginRequest.create({
    required String email,
    required String password,
  }) {
    return LoginRequest(
      requestId: const Uuid().v4(),
      email: email,
      password: password,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      'email': email,
      'password': password,
      'version': version,
    };
  }
}
