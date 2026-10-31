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
      return ActivityDay(
        date: date,
        minutes: 0.0,
        goalMinutes: 10,
        goalMet: false,
      );
    });

    return _cachedStats ??
        ProgressStats(
          streakDays: 0,
          longestStreak: 0,
          freezeCount: 0,
          goalMetToday: false,
          dailyGoalMinutes: 10,
          totalMinutesLearned: 0.0,
          completedLessons: 0,
          signsMastered: 0,
          averageScore: 0,
          expBalance: 0,
          aiBonusQuota: 5,
          unlockTicketCount: 0,
          recentActivities: activities,
        );
  }

  List<BadgeItem> _getFallbackBadges() {
    return _cachedBadges ??
        const [
          BadgeItem(
            code: 'first_step',
            title: 'Bước Đầu Tiên',
            description: 'Hoàn thành bài học ký hiệu VSL đầu tiên của bạn',
            category: 'Học tập',
            level: 1,
            maxLevel: 1,
            currentValue: 0,
            targetValue: 1,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 50,
          ),
          BadgeItem(
            code: 'streak_master_7',
            title: 'Ngọn Lửa Kiên Trì',
            description: 'Duy trì chuỗi học tập 7 ngày liên tiếp',
            category: 'Streak',
            level: 1,
            maxLevel: 3,
            currentValue: 0,
            targetValue: 7,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 100,
          ),
          BadgeItem(
            code: 'streak_legend_30',
            title: 'Huyền Thoại Kỷ Luật',
            description: 'Đạt chuỗi streak học tập 30 ngày liên tục',
            category: 'Streak',
            level: 1,
            maxLevel: 3,
            currentValue: 0,
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
            level: 1,
            maxLevel: 3,
            currentValue: 0,
            targetValue: 50,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 150,
          ),
          BadgeItem(
            code: 'ai_perfect_score',
            title: 'Độ Chính Xác Tuyệt Đối',
            description: 'Đạt điểm AI chấm ký hiệu 100/100 trong 5 bài tập',
            category: 'Thực hành',
            level: 1,
            maxLevel: 3,
            currentValue: 0,
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
            currentValue: 0,
            targetValue: 1,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 80,
          ),
          BadgeItem(
            code: 'early_bird',
            title: 'Chú Chim Sớm',
            description: 'Luyện tập vào buổi sáng trước 8:00 trong 5 ngày',
            category: 'Thói quen',
            level: 1,
            maxLevel: 2,
            currentValue: 0,
            targetValue: 5,
            isUnlocked: false,
            isCelebrated: false,
            expReward: 90,
          ),
          BadgeItem(
            code: 'sign_polyglot_200',
            title: 'Đại Sứ Ký Hiệu',
            description: 'Nắm vững 200 ký hiệu trong từ điển VSL',
            category: 'Từ vựng',
            level: 1,
            maxLevel: 3,
            currentValue: 0,
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
