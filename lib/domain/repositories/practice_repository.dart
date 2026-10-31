import '../../data/models/practice/practice_model.dart';

abstract interface class PracticeRepository {
  Future<VocabularySession> getVocabularySession();
  Future<bool> submitVocabularyAnswer(PracticeAnswer answer);
  Future<FingerspellSession> getFingerspellSession();
  Future<bool> submitFingerspellAttempt(PracticeAnswer answer);
  Future<VocabularySession> getNumbersSession();
  Future<AiPracticeSessionResponse> getAiPracticeSession({
    int size = 400,
    String? signId,
  });
  Future<AiAttemptResponse?> submitAiAttempt({
    required String targetSignId,
    required String modelVersion,
    required List<List<double>> features,
    required int frameCount,
    required int durationMs,
    required double handFrameRatio,
    required String sessionId,
  });
  PracticeStats getPracticeStats();
  Future<PracticeStats> recordSessionResult({
    required int answered,
    required int correct,
  });
  Future<void> resetStats();
}
