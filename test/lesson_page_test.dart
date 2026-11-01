import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/domain/entities/learning.dart';
import 'package:sightlight_flutter/domain/repositories/learning_repository.dart';
import 'package:sightlight_flutter/presentation/pages/learning/lesson_page.dart';
import 'package:sightlight_flutter/presentation/providers/learning_provider.dart';

void main() {
  testWidgets('lesson shows and advances one exercise at a time', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          learningRepositoryProvider.overrideWithValue(
            _FakeLearningRepository(),
          ),
        ],
        child: const MaterialApp(home: LessonPage(lessonId: 'lesson-1')),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Câu 1/2'), findsOneWidget);
    expect(find.text('Câu thứ nhất'), findsOneWidget);
    expect(find.text('Câu thứ hai'), findsNothing);

    await tester.tap(find.text('Xin chào'));
    await tester.tap(find.text('Kiểm tra'));
    await tester.pumpAndSettle();

    expect(find.text('Câu tiếp theo'), findsOneWidget);
    expect(find.text('Câu thứ hai'), findsNothing);

    await tester.tap(find.text('Câu tiếp theo'));
    await tester.pumpAndSettle();

    expect(find.text('Câu 2/2'), findsOneWidget);
    expect(find.text('Câu thứ nhất'), findsNothing);
    expect(find.text('Câu thứ hai'), findsOneWidget);
  });
}

class _FakeLearningRepository implements LearningRepository {
  final LessonDetail lesson = const LessonDetail(
    id: 'lesson-1',
    title: 'Bài kiểm tra',
    summary: '',
    estimatedMinutes: 3,
    blocks: [],
    resumeAtIndex: 0,
    exercises: [
      LessonExercise(
        id: 'exercise-1',
        type: 'SIGN_TO_MEANING',
        instruction: 'Câu thứ nhất',
        prompt: 'Chọn nghĩa đúng',
        options: [LessonOption(id: 'option-1', label: 'Xin chào')],
        tokens: [],
      ),
      LessonExercise(
        id: 'exercise-2',
        type: 'TYPE_WHAT_YOU_SEE',
        instruction: 'Câu thứ hai',
        prompt: 'Nhập đáp án',
        options: [],
        tokens: [],
      ),
    ],
  );

  @override
  Future<LessonDetail> getLesson(String lessonId) async => lesson;

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
    return const AnswerFeedback(
      correct: true,
      attemptNo: 1,
      willRepeat: false,
      correctOptionId: 'option-1',
    );
  }

  @override
  Future<LessonCompletion> completeLesson(
    String lessonId, {
    required int activeSeconds,
  }) async {
    return const LessonCompletion(scorePercent: 100, earnedExp: 10);
  }

  @override
  Future<List<CourseSummary>> getCourses() => throw UnimplementedError();

  @override
  Future<LearningPath> getLearningPath(String courseId) =>
      throw UnimplementedError();
}
