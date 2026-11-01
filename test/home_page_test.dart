import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/domain/entities/learning.dart';
import 'package:sightlight_flutter/domain/entities/progress_stats.dart';
import 'package:sightlight_flutter/domain/entities/award.dart';
import 'package:sightlight_flutter/domain/repositories/gamification_repository.dart';
import 'package:sightlight_flutter/presentation/pages/home_page.dart';
import 'package:sightlight_flutter/presentation/providers/gamification_provider.dart';
import 'package:sightlight_flutter/presentation/providers/learning_provider.dart';

void main() {
  testWidgets('HomePage renders the learning path returned by the API layer', (
    tester,
  ) async {
    const path = LearningPath(
      courseId: 'course-1',
      courseName: 'VSL cơ bản',
      nextLessonId: 'lesson-1',
      units: [
        LearningUnit(
          id: 'unit-1',
          number: 1,
          title: 'Chào hỏi',
          isLocked: false,
          isFree: true,
          starsEarned: 0,
          lessons: [
            LearningLesson(
              id: 'lesson-1',
              title: 'Bài 1: Xin chào',
              subtitle: 'Chương mở đầu',
              status: 'NOT_STARTED',
              isLocked: false,
              premiumLocked: false,
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          learningPathProvider.overrideWith((ref) async => path),
          progressStatsProvider.overrideWith(
            (ref) => _FakeProgressStatsNotifier(),
          ),
        ],
        child: const MaterialApp(home: HomePage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Tiếp tục học'), findsOneWidget);
    expect(find.text('Lộ trình học'), findsOneWidget);
    expect(find.text('Chào hỏi'), findsWidgets);
    expect(find.text('0/1 bài • 0%'), findsWidgets);
    expect(find.text('Bắt đầu'), findsWidgets);
    expect(find.byType(ListView), findsOneWidget);
  });
}

class _FakeProgressStatsNotifier extends ProgressStatsNotifier {
  _FakeProgressStatsNotifier() : super(_FakeGamificationRepository()) {
    state = const AsyncValue.data(ProgressStats());
  }
}

class _FakeGamificationRepository implements GamificationRepository {
  @override
  Future<ProgressStats> getProgressOverview() async => const ProgressStats();

  @override
  Future<List<ActivityDay>> getProgressActivity({int days = 7}) async => [];

  @override
  Future<List<BadgeItem>> getAwards() async => [];

  @override
  Future<void> celebrateAward(String code) async {}

  @override
  Future<void> freezeStreak() async {}
}
