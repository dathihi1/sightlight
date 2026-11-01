import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_client.dart';
import '../../data/datasources/gamification_remote_datasource.dart';
import '../../data/repositories/gamification_repository_impl.dart';
import '../../domain/entities/progress_stats.dart';
import '../../domain/entities/award.dart';
import '../../domain/repositories/gamification_repository.dart';

final gamificationRemoteDataSourceProvider =
    Provider<GamificationRemoteDataSource>((ref) {
      final dio = ref.watch(dioProvider);
      return GamificationRemoteDataSource(dio);
    });

final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  final remote = ref.watch(gamificationRemoteDataSourceProvider);
  return GamificationRepositoryImpl(remote);
});

final progressStatsProvider =
    StateNotifierProvider<ProgressStatsNotifier, AsyncValue<ProgressStats>>((
      ref,
    ) {
      final repository = ref.watch(gamificationRepositoryProvider);
      return ProgressStatsNotifier(repository);
    });

class ProgressStatsNotifier extends StateNotifier<AsyncValue<ProgressStats>> {
  ProgressStatsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadStats();
  }

  final GamificationRepository _repository;

  Future<void> loadStats() async {
    state = const AsyncValue.loading();
    try {
      final stats = await _repository.getProgressOverview();
      state = AsyncValue.data(stats);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<bool> freezeStreak() async {
    final current = state.valueOrNull;
    if (current == null) return false;

    // Optimistically update
    state = AsyncValue.data(
      current.copyWith(freezeCount: current.freezeCount + 1),
    );

    try {
      await _repository.freezeStreak();
      return true;
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      return false;
    }
  }
}

// Activity filter period: 7 or 30 days
final activityDaysRangeProvider = StateProvider<int>((ref) => 7);

final awardsProvider =
    StateNotifierProvider<AwardsNotifier, AsyncValue<List<BadgeItem>>>((ref) {
      final repository = ref.watch(gamificationRepositoryProvider);
      return AwardsNotifier(repository);
    });

class AwardsNotifier extends StateNotifier<AsyncValue<List<BadgeItem>>> {
  AwardsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadAwards();
  }

  final GamificationRepository _repository;

  Future<void> loadAwards() async {
    state = const AsyncValue.loading();
    try {
      final badges = await _repository.getAwards();
      state = AsyncValue.data(badges);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> celebrateBadge(String code) async {
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncValue.data(
        current
            .map((b) => b.code == code ? b.copyWith(isCelebrated: true) : b)
            .toList(),
      );
    }

    try {
      await _repository.celebrateAward(code);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
