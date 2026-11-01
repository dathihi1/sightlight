import '../../domain/entities/award.dart';
import '../../domain/entities/progress_stats.dart';
import '../../domain/repositories/gamification_repository.dart';
import '../datasources/gamification_remote_datasource.dart';

class GamificationRepositoryImpl implements GamificationRepository {
  GamificationRepositoryImpl(this._remoteDataSource);

  final GamificationRemoteDataSource _remoteDataSource;

  @override
  Future<ProgressStats> getProgressOverview() async {
    final response = await _remoteDataSource.getProgressOverview();
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể tải tiến độ học tập');
    }
    return response.result!.toEntity();
  }

  @override
  Future<List<ActivityDay>> getProgressActivity({int days = 7}) async {
    final response = await _remoteDataSource.getProgressActivity();
    if (response.isError || response.result == null) {
      throw Exception(
        response.errorMessage ?? 'Không thể tải lịch sử hoạt động',
      );
    }
    final activities = response.result!.map((item) => item.toEntity()).toList();
    return activities.length > days
        ? activities.sublist(activities.length - days)
        : activities;
  }

  @override
  Future<List<BadgeItem>> getAwards() async {
    final response = await _remoteDataSource.getAwards();
    if (response.isError || response.result == null) {
      throw Exception(response.errorMessage ?? 'Không thể tải huy hiệu');
    }
    return response.result!.map((item) => item.toEntity()).toList();
  }

  @override
  Future<void> celebrateAward(String code) async {
    final response = await _remoteDataSource.celebrateAward(code);
    if (response.isError) {
      throw Exception(
        response.errorMessage ?? 'Không thể cập nhật trạng thái huy hiệu',
      );
    }
  }

  @override
  Future<void> freezeStreak() async {
    final response = await _remoteDataSource.freezeStreak();
    if (response.isError) {
      throw Exception(response.errorMessage ?? 'Không thể đổi vật phẩm');
    }
  }
}
