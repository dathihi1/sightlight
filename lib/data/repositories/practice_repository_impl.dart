import '../../domain/repositories/practice_repository.dart';
import '../datasources/practice_local_datasource.dart';
import '../datasources/practice_remote_datasource.dart';
import '../models/practice/practice_model.dart';

class PracticeRepositoryImpl implements PracticeRepository {
  const PracticeRepositoryImpl(this._remoteDataSource, this._localDataSource);

  final PracticeRemoteDataSource _remoteDataSource;
  final PracticeLocalDataSource _localDataSource;

  @override
  Future<VocabularySession> getVocabularySession() =>
      _remoteDataSource.getVocabularySession();

  @override
  Future<bool> submitVocabularyAnswer(PracticeAnswer answer) =>
      _remoteDataSource.submitVocabularyAnswer(answer);

  @override
  Future<FingerspellSession> getFingerspellSession() =>
      _remoteDataSource.getFingerspellSession();

  @override
  Future<bool> submitFingerspellAttempt(PracticeAnswer answer) =>
      _remoteDataSource.submitFingerspellAttempt(answer);

  @override
  Future<VocabularySession> getNumbersSession() =>
      _remoteDataSource.getNumbersSession();

  @override
  Future<AiPracticeSessionResponse> getAiPracticeSession({
    int size = 400,
    String? signId,
  }) => _remoteDataSource.getAiPracticeSession(size: size, signId: signId);

  @override
  Future<AiQuotaResponse> getAiQuota() => _remoteDataSource.getAiQuota();

  @override
  Future<AiCapabilitiesResponse> getAiCapabilities({required int modelSize}) =>
      _remoteDataSource.getAiCapabilities(modelSize: modelSize);

  @override
  Future<AiAttemptResponse?> submitAiAttempt({
    required String targetSignId,
    required String modelVersion,
    required List<List<double>> features,
    required int frameCount,
    required int durationMs,
    required double handFrameRatio,
    required String sessionId,
  }) => _remoteDataSource.submitAiAttempt(
    targetSignId: targetSignId,
    modelVersion: modelVersion,
    features: features,
    frameCount: frameCount,
    durationMs: durationMs,
    handFrameRatio: handFrameRatio,
    sessionId: sessionId,
  );

  @override
  PracticeStats getPracticeStats() => _localDataSource.getPracticeStats();

  @override
  Future<PracticeStats> recordSessionResult({
    required int answered,
    required int correct,
  }) => _localDataSource.recordSessionResult(
    answered: answered,
    correct: correct,
  );

  @override
  Future<void> resetStats() => _localDataSource.resetStats();
}
