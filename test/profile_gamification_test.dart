import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sightlight_flutter/data/models/gamification/award_dto.dart';
import 'package:sightlight_flutter/data/models/gamification/progress_stats_dto.dart';
import 'package:sightlight_flutter/data/models/user/user_profile_dto.dart';
import 'package:sightlight_flutter/domain/entities/award.dart';
import 'package:sightlight_flutter/domain/entities/progress_stats.dart';
import 'package:sightlight_flutter/domain/entities/user_profile.dart';
import 'package:sightlight_flutter/presentation/widgets/activity_chart_widget.dart';
import 'package:sightlight_flutter/presentation/widgets/badge_celebration_dialog.dart';
import 'package:sightlight_flutter/presentation/widgets/streak_tracker_widget.dart';

void main() {
  group('UserProfile & UserPreferences Domain Entities', () {
    test('UserPreferences serialization & copyWith', () {
      const prefs = UserPreferences(
        dailyGoalMinutes: 20,
        notificationsEnabled: true,
        uiLocale: 'vi',
        videoSpeed: '1.25',
      );

      final json = prefs.toJson();
      expect(json['dailyGoalMinutes'], 20);
      expect(json['notificationsEnabled'], true);
      expect(json['uiLocale'], 'vi');
      expect(json['videoSpeed'], '1.25');

      final fromJson = UserPreferences.fromJson(json);
      expect(fromJson.dailyGoalMinutes, 20);
      expect(fromJson.notificationsEnabled, true);
      expect(fromJson.uiLocale, 'vi');
      expect(fromJson.videoSpeed, '1.25');

      final updated = prefs.copyWith(dailyGoalMinutes: 30, uiLocale: 'en');
      expect(updated.dailyGoalMinutes, 30);
      expect(updated.uiLocale, 'en');
      expect(updated.notificationsEnabled, true);
    });

    test('UserProfileDto parsing to UserProfile domain entity', () {
      final rawJson = {
        'userId': 'usr-123',
        'email': 'learner@signlight.vn',
        'displayName': 'Nguyễn Văn Học',
        'avatarUrl': 'https://example.com/avatar.jpg',
        'isPremium': true,
        'emailVerified': true,
        'roles': ['LEARNER_PREMIUM'],
        'preferences': {
          'dailyGoalMinutes': 25,
          'videoSpeed': '1.0',
          'uiLocale': 'vi',
          'notificationsEnabled': true,
        },
      };

      final dto = UserProfileDto.fromJson(rawJson);
      final profile = dto.toEntity();

      expect(profile.userId, 'usr-123');
      expect(profile.email, 'learner@signlight.vn');
      expect(profile.displayName, 'Nguyễn Văn Học');
      expect(profile.isPremium, true);
      expect(profile.preferences.dailyGoalMinutes, 25);

      final updated = profile.copyWith(displayName: 'Nguyễn Văn Minh');
      expect(updated.displayName, 'Nguyễn Văn Minh');
      expect(updated.email, 'learner@signlight.vn');
    });
  });

  group('ProgressStats & ActivityDay Domain Entities', () {
    test('ActivityDayDto parsing and domain mapping', () {
      final rawJson = {
        'date': '2026-03-20T00:00:00.000Z',
        'minutes': 25.0,
        'goalMinutes': 20,
        'goalMet': true,
      };

      final dto = ActivityDayDto.fromJson(rawJson);
      final day = dto.toEntity();

      expect(day.minutes, 25.0);
      expect(day.goalMinutes, 20);
      expect(day.goalMet, true);
      expect(day.date.year, 2026);
    });

    test('ProgressStatsDto parsing and calculations', () {
      final rawJson = {
        'streakDays': 5,
        'longestStreak': 12,
        'freezeCount': 2,
        'goalMetToday': true,
        'dailyGoalMinutes': 15,
        'totalMinutesLearned': 180.0,
        'completedLessons': 14,
        'signsMastered': 42,
        'averageScore': 92,
        'expBalance': 1250,
        'recentActivities': [
          {
            'date': '2026-03-20T00:00:00.000Z',
            'minutes': 25.0,
            'goalMinutes': 15,
            'goalMet': true,
          },
        ],
      };

      final dto = ProgressStatsDto.fromJson(rawJson);
      final stats = dto.toEntity();

      expect(stats.streakDays, 5);
      expect(stats.longestStreak, 12);
      expect(stats.freezeCount, 2);
      expect(stats.goalMetToday, true);
      expect(stats.totalMinutesLearned, 180.0);
      expect(stats.signsMastered, 42);
      expect(stats.averageScore, 92);
      expect(stats.recentActivities.length, 1);
    });
  });

  group('Award & BadgeItem Domain Entities', () {
    test('BadgeItemDto parsing and domain progress ratio calculation', () {
      final rawJson = {
        'code': 'SIGN_MASTER',
        'title': 'Bậc thầy ký hiệu',
        'description': 'Thuộc 100 từ vựng VSL',
        'category': 'Vocabulary',
        'level': 2,
        'maxLevel': 5,
        'currentValue': 40,
        'targetValue': 50,
        'isUnlocked': true,
        'isCelebrated': false,
        'expReward': 200,
      };

      final dto = BadgeItemDto.fromJson(rawJson);
      final badge = dto.toEntity();

      expect(badge.code, 'SIGN_MASTER');
      expect(badge.progressRatio, 0.8);
      expect(badge.isUnlocked, true);
      expect(badge.expReward, 200);
    });
  });

  group('StreakTrackerWidget Test', () {
    testWidgets('renders streak count and freeze button', (tester) async {
      bool freezePressed = false;
      const stats = ProgressStats(
        streakDays: 7,
        longestStreak: 14,
        freezeCount: 3,
        totalMinutesLearned: 200.0,
        completedLessons: 10,
        signsMastered: 30,
        averageScore: 95,
        expBalance: 500,
        goalMetToday: true,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StreakTrackerWidget(
              stats: stats,
              onFreezePressed: () {
                freezePressed = true;
              },
            ),
          ),
        ),
      );

      expect(find.text('7 ngày'), findsOneWidget);
      expect(find.text('Kỷ lục: 14 ngày liên tục'), findsOneWidget);
      expect(find.text('Đóng băng (3)'), findsOneWidget);
      expect(find.text('Đã hoàn thành'), findsOneWidget);

      await tester.tap(find.text('Đóng băng (3)'));
      expect(freezePressed, isTrue);
    });
  });

  group('ActivityChartWidget Test', () {
    testWidgets('renders chart and toggles between 7 and 30 days', (
      tester,
    ) async {
      int selectedDays = 7;
      final sampleDays = List.generate(7, (i) {
        return ActivityDay(
          date: DateTime.now().subtract(Duration(days: 6 - i)),
          minutes: (i + 1) * 10.0,
          goalMinutes: 15,
          goalMet: (i + 1) * 10 >= 15,
        );
      });

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ActivityChartWidget(
              activities: sampleDays,
              selectedDays: selectedDays,
              onDaysChanged: (days) {
                selectedDays = days;
              },
            ),
          ),
        ),
      );

      expect(find.text('Thời gian học tập'), findsOneWidget);
      expect(find.text('7 ngày'), findsOneWidget);
      expect(find.text('30 ngày'), findsOneWidget);

      await tester.tap(find.text('30 ngày'));
      expect(selectedDays, 30);
    });
  });

  group('BadgeCelebrationDialog Test', () {
    testWidgets('renders celebratory content and fires onCelebrated', (
      tester,
    ) async {
      bool celebrated = false;
      const testBadge = BadgeItem(
        code: 'FIRST_SIGN',
        title: 'Bước chân đầu tiên',
        description: 'Hoàn thành bài học ký hiệu VSL đầu tiên',
        level: 1,
        maxLevel: 1,
        currentValue: 1,
        targetValue: 1,
        isUnlocked: true,
        expReward: 100,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    BadgeCelebrationDialog.show(
                      context,
                      badge: testBadge,
                      onCelebrated: () {
                        celebrated = true;
                      },
                    );
                  },
                  child: const Text('Show Dialog'),
                );
              },
            ),
          ),
        ),
      );

      await tester.tap(find.text('Show Dialog'));
      await tester.pumpAndSettle();

      expect(find.text('CHÚC MỪNG!'), findsOneWidget);
      expect(find.text('Bước chân đầu tiên'), findsOneWidget);
      expect(find.text('+100 EXP nhận được'), findsOneWidget);

      await tester.tap(find.text('Tuyệt vời!'));
      await tester.pumpAndSettle();

      expect(celebrated, isTrue);
      expect(find.text('CHÚC MỪNG!'), findsNothing);
    });
  });
}
