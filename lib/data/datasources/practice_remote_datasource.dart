import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../models/practice/practice_model.dart';

class PracticeRemoteDataSource {
  const PracticeRemoteDataSource(this._dio);

  final Dio _dio;

  Future<VocabularySession> getVocabularySession() async {
    final response = await _dio.get(ApiConstants.vocabularySession);
    final data = response.data as Map<String, dynamic>;
    return VocabularySession.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<bool> submitVocabularyAnswer(PracticeAnswer answer) async {
    await _dio.post(ApiConstants.vocabularyAnswer, data: answer.toJson());
    return true;
  }

  Future<FingerspellSession> getFingerspellSession() async {
    final response = await _dio.get(ApiConstants.fingerspellSession);
    final data = response.data as Map<String, dynamic>;
    return FingerspellSession.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<bool> submitFingerspellAttempt(PracticeAnswer answer) async {
    await _dio.post(ApiConstants.fingerspellAttempt, data: answer.toJson());
    return true;
  }

  Future<VocabularySession> getNumbersSession() async {
    final response = await _dio.get(ApiConstants.numbersSession);
    final data = response.data as Map<String, dynamic>;
    return VocabularySession.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<AiPracticeSessionResponse> getAiPracticeSession({
    int size = 400,
    String? signId,
  }) async {
    final queryParameters = <String, dynamic>{
      'size': size,
      'modelSize': size,
      'signId': ?signId,
    };
    final response = await _dio.get(
      ApiConstants.aiPracticeSession,
      queryParameters: queryParameters,
    );
    final data = response.data as Map<String, dynamic>;
    return AiPracticeSessionResponse.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<AiQuotaResponse> getAiQuota() async {
    final response = await _dio.get(ApiConstants.aiQuota);
    final data = response.data as Map<String, dynamic>;
    return AiQuotaResponse.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<AiCapabilitiesResponse> getAiCapabilities({
    required int modelSize,
  }) async {
    final response = await _dio.get(
      ApiConstants.aiCapabilities,
      queryParameters: {'modelSize': modelSize},
    );
    final data = response.data as Map<String, dynamic>;
    return AiCapabilitiesResponse.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<AiAttemptResponse?> submitAiAttempt({
    required String targetSignId,
    required String modelVersion,
    required List<List<double>> features,
    required int frameCount,
    required int durationMs,
    required double handFrameRatio,
    required String sessionId,
  }) async {
    final payload = <String, dynamic>{
      'targetSignId': targetSignId,
      'modelVersion': modelVersion,
      'features': features,
      'frameCount': frameCount.clamp(1, 64),
      'durationMs': durationMs.clamp(1, 6000),
      'clientQuality': {
        'handFrameRatio': handFrameRatio.clamp(0.0, 1.0),
        'bothHandsRatio': 0.0,
        'poseDetected': false,
      },
    };
    if (_isUuid(sessionId)) payload['sessionId'] = sessionId;

    final response = await _dio.post(ApiConstants.aiAttempts, data: payload);
    final data = response.data as Map<String, dynamic>;
    return AiAttemptResponse.fromJson(
      data['result'] as Map<String, dynamic>? ?? const {},
    );
  }

  bool _isUuid(String value) => RegExp(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
  ).hasMatch(value);
}
