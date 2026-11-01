import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/datasources/learning_remote_datasource.dart';
import 'package:sightlight_flutter/domain/entities/learning.dart';

void main() {
  test('learning path parser preserves lock and completion state', () async {
    final dio = Dio();
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) => handler.resolve(
          Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'requestId': 'req-1',
              'errorCode': '00000',
              'errorMessage': 'Success',
              'result': {
                'courseId': 'course-1',
                'courseName': 'VSL cơ bản',
                'nextLessonId': 'lesson-2',
                'units': [
                  {
                    'id': 'unit-1',
                    'title': 'Chào hỏi',
                    'isFree': true,
                    'starsEarned': 3,
                    'chapters': [
                      {
                        'id': 'chapter-1',
                        'title': 'Mở đầu',
                        'lessons': [
                          {
                            'id': 'lesson-1',
                            'title': 'Xin chào',
                            'status': 'COMPLETED',
                            'locked': false,
                            'premiumLocked': false,
                            'bestScorePercent': 90,
                          },
                          {
                            'id': 'lesson-2',
                            'title': 'Tạm biệt',
                            'status': 'NOT_STARTED',
                            'locked': true,
                            'lockedReason': 'Hoàn thành bài trước',
                            'premiumLocked': false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          ),
        ),
      ),
    );

    final response = await LearningRemoteDataSource(dio)
        .getLearningPath('course-1');
    final path = response.result!;

    expect(path.nextLessonId, 'lesson-2');
    expect(path.units.single.completedCount, 1);
    expect(path.units.single.lessons.first.isCompleted, isTrue);
    expect(path.units.single.lessons.last.isLocked, isTrue);
    expect(path.units.single.lessons.last.lockedReason, 'Hoàn thành bài trước');
  });

  test(
    'lesson parser never expects a correct-answer field from options',
    () async {
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) => handler.resolve(
            Response(
              requestOptions: options,
              statusCode: 200,
              data: {
                'requestId': 'req-2',
                'errorCode': '00000',
                'errorMessage': 'Success',
                'result': {
                  'lessonId': 'lesson-1',
                  'title': 'Xin chào',
                  'summary': 'Bài mở đầu',
                  'estimatedMinutes': 5,
                  'resumeAtIndex': 0,
                  'blocks': [],
                  'exercises': [
                    {
                      'id': 'exercise-1',
                      'type': 'SIGN_TO_MEANING',
                      'instructionText': 'Chọn nghĩa đúng',
                      'promptText': 'Ký hiệu này có nghĩa gì?',
                      'skill': 'Từ vựng',
                      'difficulty': 'Dễ',
                      'tokens': ['xin', 'chào'],
                      'options': [
                        {'id': 'option-1', 'labelText': 'Xin chào'},
                        {'id': 'option-2', 'labelText': 'Tạm biệt'},
                      ],
                    },
                  ],
                },
              },
            ),
          ),
        ),
      );

      final lesson = (await LearningRemoteDataSource(dio).getLesson('lesson-1'))
          .result!;

      expect(lesson.exercises.single.options, hasLength(2));
      expect(lesson.exercises.single.options.first.label, 'Xin chào');
      expect(lesson.exercises.single.tokens, ['xin', 'chào']);
      expect(lesson.exercises.single.skill, 'Từ vựng');
    },
  );

  test(
    'complex lesson answer sends the same payload as the web client',
    () async {
      late Map<String, dynamic> requestBody;
      final dio = Dio();
      dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            requestBody = Map<String, dynamic>.from(
              options.data as Map<String, dynamic>,
            );
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'requestId': 'req-3',
                  'errorCode': '00000',
                  'errorMessage': 'Success',
                  'result': {
                    'isCorrect': true,
                    'attemptNo': 1,
                    'correctOptionId': 'option-2',
                    'correctAnswerText': null,
                    'explanationVideoUrl': null,
                    'willRepeat': false,
                  },
                },
              ),
            );
          },
        ),
      );

      final response = await LearningRemoteDataSource(dio).submitAnswer(
        lessonId: 'lesson-1',
        exerciseId: 'exercise-2',
        answerType: 'MATCH_SIGN_MEANING',
        orderedTokens: const ['tôi', 'xin', 'chào'],
        matches: const [
          LessonMatchPair(promptId: 'prompt-1', optionId: 'option-2'),
        ],
        clientElapsedMs: 4200,
      );

      expect(requestBody['orderedTokens'], ['tôi', 'xin', 'chào']);
      expect(requestBody['matches'], [
        {'promptId': 'prompt-1', 'optionId': 'option-2'},
      ]);
      expect(requestBody['clientElapsedMs'], 4200);
      expect(response.result?.correctOptionId, 'option-2');
    },
  );
}
