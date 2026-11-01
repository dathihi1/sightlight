import '../../domain/entities/learning.dart';
import '../../domain/repositories/learning_repository.dart';
import '../datasources/learning_remote_datasource.dart';

class LearningRepositoryImpl implements LearningRepository {
  const LearningRepositoryImpl(this._remote);

  final LearningRemoteDataSource _remote;

  @override
  Future<List<CourseSummary>> getCourses() async {
    final response = await _remote.getCourses();
    if (response.isError) throw Exception(response.errorMessage);
    return response.result ?? const [];
  }

  @override
  Future<LearningPath> getLearningPath(String courseId) async {
    final response = await _remote.getLearningPath(courseId);
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể tải lộ trình học');
    }
    return response.result!;
  }

  @override
  Future<LessonDetail> getLesson(String lessonId) async {
    final response = await _remote.getLesson(lessonId);
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể tải bài học');
    }
    return response.result!;
  }

  @override
  Future<AnswerFeedback> submitAnswer({
    required String lessonId,
    required String exerciseId,
    required String answerType,
    String? selectedOptionId,
    String? typedAnswer,
    List<String>? orderedTokens,
    List<LessonMatchPair>? matches,
    int? clientElapsedMs,
  }) async {
    final response = await _remote.submitAnswer(
      lessonId: lessonId,
      exerciseId: exerciseId,
      answerType: answerType,
      selectedOptionId: selectedOptionId,
      typedAnswer: typedAnswer,
      orderedTokens: orderedTokens,
      matches: matches,
      clientElapsedMs: clientElapsedMs,
    );
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể nộp câu trả lời');
    }
    return response.result!;
  }

  @override
  Future<LessonCompletion> completeLesson(
    String lessonId, {
    required int activeSeconds,
  }) async {
    final response = await _remote.completeLesson(
      lessonId,
      activeSeconds: activeSeconds,
    );
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể hoàn thành bài học');
    }
    return response.result!;
  }
}
