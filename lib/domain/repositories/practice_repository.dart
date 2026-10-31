import '../../data/models/practice/practice_model.dart';

abstract interface class PracticeRepository {
  Future<VocabularySession> getVocabularySession();
  Future<bool> submitVocabularyAnswer(PracticeAnswer answer);
  Future<FingerspellSession> getFingerspellSession();
  Future<bool> submitFingerspellAttempt(PracticeAnswer answer);
  Future<VocabularySession> getNumbersSession();
  PracticeStats getPracticeStats();
  Future<PracticeStats> recordSessionResult({
    required int answered,
    required int correct,
  });
  Future<void> resetStats();
}
