import 'package:dio/dio.dart';
import '../../domain/entities/progress_stats.dart';
import '../../domain/entities/award.dart';
import '../../domain/repositories/gamification_repository.dart';
import '../datasources/gamification_remote_datasource.dart';

class GamificationRepositoryImpl implements GamificationRepository {
  GamificationRepositoryImpl(this._remoteDataSource);

  final GamificationRemoteDataSource _remoteDataSource;

  ProgressStats? _cachedStats;
  List<BadgeItem>? _cachedBadges;

  ProgressStats _getFallbackStats() {
    final now = DateTime.now();
    final activities = List.generate(30, (index) {
      final date = now.subtract(Duration(days: 29 - index));
      final hasStudied = (index % 7 != 2 && index % 5 != 0) || index >= 24;
      final minutes = hasStudied ? (15.0 + (index % 4) * 8.0) : 0.0;
      return ActivityDay(
        date: date,
        minutes: minutes,
        goalMinutes: 20,
        goalMet: minutes >= 20,
      );
    });

    return _cachedStats ??
        ProgressStats(
          streakDays: 7,
          longestStreak: 14,
          freezeCount: 2,
          goalMetToday: true,
          dailyGoalMinutes: 20,
          totalMinutesLearned: 385.0,
          completedLessons: 24,
          signsMastered: 86,
          averageScore: 92,
          expBalance: 1450,
          aiBonusQuota: 5,
          unlockTicketCount: 3,
          recentActivities: activities,
        );
  }

  List<BadgeItem> _getFallbackBadges() {
    return _cachedBadges ??
        [
          BadgeItem(
            code: 'first_step',
            title: 'Bước Đầu Tiên',
            description: 'Hoàn thành bài học ký hiệu VSL đầu tiên của bạn',
            category: 'Học tập',
            level: 1,
            maxLevel: 1,
            currentValue: 1,
            targetValue: 1,
            isUnlocked: true,
            isCelebrated: true,
            unlockedAt: DateTime.now().subtract(const Duration(days: 10)),
            expReward: 50,
          ),
          BadgeItem(
            code: 'streak_master_7',
            title: 'Ngọn Lửa Kiên Trì',
            description: 'Duy trì chuỗi học tập 7 ngày liên tiếp',
            category: 'Streak',
            level: 2,
            maxLevel: 3,
            currentValue: 7,
            targetValue: 7,
            isUnlocked: true,
            isCelebrated: false,
            unlockedAt: DateTime.now().subtract(const Duration(hours: 4)),
            expReward: 100,
          ),
          const BadgeItem(
            code: 'streak_legend_30',
            title: 'Huyền Thoại Kỷ Luật',
            description: 'Đạt chuỗi streak học tập 30 ngày liên tục',
            category: 'Streak',
            level: 1,
            maxLevel: 3,
            currentValue: 7,
            targetValue: 30,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 300,
          ),
          BadgeItem(
            code: 'sign_master_50',
            title: 'Bậc Thầy Từ Vựng',
            description: 'Thành thạo 50 ký hiệu cử chỉ tay VSL',
            category: 'Từ vựng',
            level: 2,
            maxLevel: 3,
            currentValue: 86,
            targetValue: 50,
            isUnlocked: true,
            isCelebrated: true,
            unlockedAt: DateTime.now().subtract(const Duration(days: 3)),
            expReward: 150,
          ),
          const BadgeItem(
            code: 'ai_perfect_score',
            title: 'Độ Chính Xác Tuyệt Đối',
            description: 'Đạt điểm AI chấm ký hiệu 100/100 trong 5 bài tập',
            category: 'Thực hành',
            level: 1,
            maxLevel: 3,
            currentValue: 3,
            targetValue: 5,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 120,
          ),
          BadgeItem(
            code: 'speed_demon',
            title: 'Tia Chớp Ngôn Ngữ',
            description: 'Hoàn thành bài kiểm tra phản xạ trong dưới 60 giây',
            category: 'Thực hành',
            level: 1,
            maxLevel: 2,
            currentValue: 1,
            targetValue: 1,
            isUnlocked: true,
            isCelebrated: true,
            unlockedAt: DateTime.now().subtract(const Duration(days: 1)),
            expReward: 80,
          ),
          const BadgeItem(
            code: 'early_bird',
            title: 'Chú Chim Sớm',
            description: 'Luyện tập vào buổi sáng trước 8:00 trong 5 ngày',
            category: 'Thói quen',
            level: 1,
            maxLevel: 2,
            currentValue: 2,
            targetValue: 5,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 90,
          ),
          const BadgeItem(
            code: 'sign_polyglot_200',
            title: 'Đại Sứ Ký Hiệu',
            description: 'Nắm vững 200 ký hiệu trong từ điển VSL',
            category: 'Từ vựng',
            level: 1,
            maxLevel: 3,
            currentValue: 86,
            targetValue: 200,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 500,
          ),
        ];
  }

  @override
  Future<ProgressStats> getProgressOverview() async {
    try {
      final response = await _remoteDataSource.getProgressOverview();
      if (response.isSuccess && response.result != null) {
        _cachedStats = response.result!.toEntity();
        return _cachedStats!;
      }
      return _getFallbackStats();
    } on DioException {
      return _getFallbackStats();
    } catch (_) {
      return _getFallbackStats();
    }
  }

  @override
  Future<List<ActivityDay>> getProgressActivity({int days = 7}) async {
    try {
      final response = await _remoteDataSource.getProgressActivity();
      if (response.isSuccess && response.result != null) {
        final list = response.result!.map((e) => e.toEntity()).toList();
        if (list.length > days) {
          return list.sublist(list.length - days);
        }
        return list;
      }
    } on DioException {
      // Fallback on network error
    } catch (_) {
      // Fallback on parsing error
    }

    final stats = _getFallbackStats();
    final all = stats.recentActivities;
    if (all.length > days) {
      return all.sublist(all.length - days);
    }
    return all;
  }

  @override
  Future<List<BadgeItem>> getAwards() async {
    try {
      final response = await _remoteDataSource.getAwards();
      if (response.isSuccess &&
          response.result != null &&
          response.result!.isNotEmpty) {
        _cachedBadges = response.result!.map((e) => e.toEntity()).toList();
        return _cachedBadges!;
      }
      return _getFallbackBadges();
    } on DioException {
      return _getFallbackBadges();
    } catch (_) {
      return _getFallbackBadges();
    }
  }

  @override
  Future<void> celebrateAward(String code) async {
    try {
      await _remoteDataSource.celebrateAward(code);
    } catch (_) {}

    // Update in-memory state
    final badges = _getFallbackBadges();
    _cachedBadges = badges.map((b) {
      if (b.code == code) {
        return b.copyWith(isCelebrated: true);
      }
      return b;
    }).toList();
  }

  @override
  Future<void> freezeStreak() async {
    try {
      await _remoteDataSource.freezeStreak();
    } catch (_) {}

    // Update in-memory state: increment freezeCount if redeemed or consume freeze
    final stats = _getFallbackStats();
    _cachedStats = stats.copyWith(
      freezeCount: stats.freezeCount + 1,
    );
  }
}
