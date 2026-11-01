import '../entities/learning.dart';

abstract interface class LearningRepository {
  Future<List<CourseSummary>> getCourses();
  Future<LearningPath> getLearningPath(String courseId);
  Future<LessonDetail> getLesson(String lessonId);
  Future<AnswerFeedback> submitAnswer({
    required String lessonId,
    required String exerciseId,
    required String answerType,
    String? selectedOptionId,
    String? typedAnswer,
    List<String>? orderedTokens,
    List<LessonMatchPair>? matches,
    int? clientElapsedMs,
  });
  Future<LessonCompletion> completeLesson(
    String lessonId, {
    required int activeSeconds,
  });
}
