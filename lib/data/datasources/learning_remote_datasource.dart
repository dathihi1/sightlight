import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../../core/constants/api_constants.dart';
import '../../domain/entities/learning.dart';
import '../models/transaction_response.dart';

class LearningRemoteDataSource {
  const LearningRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<List<CourseSummary>>> getCourses() async {
    final response = await _dio.get(ApiConstants.courses);
    return TransactionResponse<List<CourseSummary>>.fromJson(
      response.data as Map<String, dynamic>,
      (json) {
        final map = json as Map<String, dynamic>;
        return (map['items'] as List<dynamic>? ?? const [])
            .map((item) {
              final value = item as Map<String, dynamic>;
              return CourseSummary(
                id: value['id']?.toString() ?? '',
                code: value['code']?.toString() ?? '',
                name: value['name']?.toString() ?? '',
                status: value['status']?.toString() ?? '',
                comingSoon: value['comingSoon'] as bool? ?? false,
              );
            })
            .where((course) => course.id.isNotEmpty)
            .toList();
      },
    );
  }

  Future<TransactionResponse<LearningPath>> getLearningPath(
    String courseId,
  ) async {
    final response = await _dio.get(ApiConstants.coursePath(courseId));
    return TransactionResponse<LearningPath>.fromJson(
      response.data as Map<String, dynamic>,
      (json) {
        final map = json as Map<String, dynamic>;
        final units = (map['units'] as List<dynamic>? ?? const [])
            .asMap()
            .entries
            .map((entry) {
              final unit = entry.value as Map<String, dynamic>;
              final lessons = <LearningLesson>[];
              for (final rawChapter
                  in unit['chapters'] as List<dynamic>? ?? const []) {
                final chapter = rawChapter as Map<String, dynamic>;
                for (final rawLesson
                    in chapter['lessons'] as List<dynamic>? ?? const []) {
                  final lesson = rawLesson as Map<String, dynamic>;
                  lessons.add(
                    LearningLesson(
                      id: lesson['id']?.toString() ?? '',
                      title: lesson['title']?.toString() ?? '',
                      subtitle: chapter['title']?.toString() ?? '',
                      status: lesson['status']?.toString() ?? 'NOT_STARTED',
                      isLocked: lesson['locked'] as bool? ?? false,
                      premiumLocked: lesson['premiumLocked'] as bool? ?? false,
                      lockedReason: lesson['lockedReason']?.toString(),
                      bestScorePercent: (lesson['bestScorePercent'] as num?)
                          ?.toInt(),
                    ),
                  );
                }
              }
              return LearningUnit(
                id: unit['id']?.toString() ?? '',
                number: entry.key + 1,
                title: unit['title']?.toString() ?? '',
                lessons: lessons
                    .where((lesson) => lesson.id.isNotEmpty)
                    .toList(),
                isLocked:
                    lessons.isNotEmpty &&
                    lessons.every((lesson) => lesson.isLocked),
                isFree: unit['isFree'] as bool? ?? false,
                starsEarned: (unit['starsEarned'] as num?)?.toInt() ?? 0,
              );
            })
            .where((unit) => unit.id.isNotEmpty)
            .toList();
        return LearningPath(
          courseId: map['courseId']?.toString() ?? courseId,
          courseName: map['courseName']?.toString() ?? '',
          nextLessonId: map['nextLessonId']?.toString(),
          units: units,
        );
      },
    );
  }

  Future<TransactionResponse<LessonDetail>> getLesson(String lessonId) async {
    final response = await _dio.get(ApiConstants.lesson(lessonId));
    return TransactionResponse<LessonDetail>.fromJson(
      response.data as Map<String, dynamic>,
      (json) {
        final map = json as Map<String, dynamic>;
        final blocks = (map['blocks'] as List<dynamic>? ?? const []).map((
          item,
        ) {
          final value = item as Map<String, dynamic>;
          return LessonBlock(
            id: value['id']?.toString() ?? '',
            type: value['blockType']?.toString() ?? '',
            title: value['title']?.toString() ?? '',
            bodyText: value['bodyText']?.toString() ?? '',
            mediaRef: value['mediaRef']?.toString(),
          );
        }).toList();
        final exercises = (map['exercises'] as List<dynamic>? ?? const [])
            .map((item) {
              final value = item as Map<String, dynamic>;
              final options = (value['options'] as List<dynamic>? ?? const [])
                  .map((option) {
                    final optionMap = option as Map<String, dynamic>;
                    return LessonOption(
                      id: optionMap['id']?.toString() ?? '',
                      label: optionMap['labelText']?.toString() ?? '',
                      videoUrl: optionMap['videoUrl']?.toString(),
                    );
                  })
                  .toList();
              return LessonExercise(
                id: value['id']?.toString() ?? '',
                type: value['type']?.toString() ?? '',
                instruction: value['instructionText']?.toString() ?? '',
                prompt: value['promptText']?.toString() ?? '',
                videoUrl: value['videoUrl']?.toString(),
                options: options,
                tokens: (value['tokens'] as List<dynamic>? ?? const [])
                    .map((token) => token.toString())
                    .toList(),
                skill: value['skill']?.toString(),
                difficulty: value['difficulty']?.toString(),
              );
            })
            .where((exercise) => exercise.id.isNotEmpty)
            .toList();
        return LessonDetail(
          id: map['lessonId']?.toString() ?? lessonId,
          title: map['title']?.toString() ?? '',
          summary: map['summary']?.toString() ?? '',
          estimatedMinutes: (map['estimatedMinutes'] as num?)?.toInt() ?? 0,
          blocks: blocks,
          exercises: exercises,
          resumeAtIndex: (map['resumeAtIndex'] as num?)?.toInt() ?? 0,
        );
      },
    );
  }

  Future<TransactionResponse<AnswerFeedback>> submitAnswer({
    required String lessonId,
    required String exerciseId,
    required String answerType,
    String? selectedOptionId,
    String? typedAnswer,
    List<String>? orderedTokens,
    List<LessonMatchPair>? matches,
    int? clientElapsedMs,
  }) async {
    final response = await _dio.post(
      ApiConstants.lessonAnswer(lessonId, exerciseId),
      data: {
        'answerType': answerType,
        'selectedOptionId': ?selectedOptionId,
        'typedAnswer': ?typedAnswer,
        'orderedTokens': ?orderedTokens,
        'matches': ?matches?.map((pair) => pair.toJson()).toList(),
        'clientElapsedMs': ?clientElapsedMs,
      },
    );
    return TransactionResponse<AnswerFeedback>.fromJson(
      response.data as Map<String, dynamic>,
      (json) {
        final map = json as Map<String, dynamic>;
        return AnswerFeedback(
          correct: map['isCorrect'] as bool? ?? false,
          attemptNo: (map['attemptNo'] as num?)?.toInt() ?? 0,
          willRepeat: map['willRepeat'] as bool? ?? false,
          correctOptionId: map['correctOptionId']?.toString(),
          correctAnswerText: map['correctAnswerText']?.toString(),
          explanationVideoUrl: map['explanationVideoUrl']?.toString(),
        );
      },
    );
  }

  Future<TransactionResponse<LessonCompletion>> completeLesson(
    String lessonId, {
    required int activeSeconds,
  }) async {
    final response = await _dio.post(
      ApiConstants.completeLesson(lessonId),
      data: {
        'idempotencyKey': const Uuid().v4(),
        'activeSeconds': activeSeconds.clamp(0, 3600),
      },
    );
    return TransactionResponse<LessonCompletion>.fromJson(
      response.data as Map<String, dynamic>,
      (json) {
        final map = json as Map<String, dynamic>;
        return LessonCompletion(
          scorePercent: (map['scorePercent'] as num?)?.toInt() ?? 0,
          earnedExp: (map['earnedExp'] as num?)?.toInt() ?? 0,
          nextLessonId: map['nextLessonId']?.toString(),
        );
      },
    );
  }
}
