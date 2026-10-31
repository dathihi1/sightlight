import '../entities/progress_stats.dart';
import '../entities/award.dart';

abstract interface class GamificationRepository {
  Future<ProgressStats> getProgressOverview();
  Future<List<ActivityDay>> getProgressActivity({int days = 7});
  Future<List<BadgeItem>> getAwards();
  Future<void> celebrateAward(String code);
  Future<void> freezeStreak();
}
