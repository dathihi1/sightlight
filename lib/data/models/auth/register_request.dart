import 'package:uuid/uuid.dart';

class RegisterRequest {
  const RegisterRequest({
    required this.requestId,
    required this.email,
    required this.password,
    required this.displayName,
    this.version = '1.0',
    this.acceptedTerms = true,
    this.referralCode,
    this.dailyGoalMinutes = 10,
  });

  final String requestId;
  final String email;
  final String password;
  final String displayName;
  final String version;
  final bool acceptedTerms;
  final String? referralCode;
  final int? dailyGoalMinutes;

  factory RegisterRequest.create({
    required String email,
    required String password,
    required String displayName,
    bool acceptedTerms = true,
    String? referralCode,
    int? dailyGoalMinutes = 10,
  }) {
    return RegisterRequest(
      requestId: const Uuid().v4(),
      email: email,
      password: password,
      displayName: displayName,
      acceptedTerms: acceptedTerms,
      referralCode: referralCode,
      dailyGoalMinutes: dailyGoalMinutes,
    );
  }

  factory RegisterRequest.fromJson(Map<String, dynamic> json) {
    return RegisterRequest(
      requestId: json['requestId'] as String,
      email: json['email'] as String,
      password: json['password'] as String,
      displayName: json['displayName'] as String,
      version: (json['version'] as String?) ?? '1.0',
      acceptedTerms: json['acceptedTerms'] as bool? ?? true,
      referralCode: json['referralCode'] as String?,
      dailyGoalMinutes: json['dailyGoalMinutes'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      'email': email,
      'password': password,
      'displayName': displayName,
      'version': version,
      'acceptedTerms': acceptedTerms,
      if (referralCode != null) 'referralCode': referralCode,
      if (dailyGoalMinutes != null) 'dailyGoalMinutes': dailyGoalMinutes,
    };
  }
}
