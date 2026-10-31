import 'package:uuid/uuid.dart';

class GoogleLoginRequest {
  const GoogleLoginRequest({
    required this.requestId,
    required this.idToken,
    this.referralCode,
    this.dailyGoalMinutes = 10,
  });

  final String requestId;
  final String idToken;
  final String? referralCode;
  final int? dailyGoalMinutes;

  factory GoogleLoginRequest.create({
    required String idToken,
    String? referralCode,
    int? dailyGoalMinutes = 10,
  }) {
    return GoogleLoginRequest(
      requestId: const Uuid().v4(),
      idToken: idToken,
      referralCode: referralCode,
      dailyGoalMinutes: dailyGoalMinutes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      'idToken': idToken,
      if (referralCode != null) 'referralCode': referralCode,
      if (dailyGoalMinutes != null) 'dailyGoalMinutes': dailyGoalMinutes,
    };
  }
}
