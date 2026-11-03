import 'package:dio/dio.dart';

import '../../core/constants/api_constants.dart';
import '../models/transaction_response.dart';
import '../models/gamification/progress_stats_dto.dart';
import '../models/gamification/award_dto.dart';

class GamificationRemoteDataSource {
  GamificationRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<ProgressStatsDto>> getProgressOverview() async {
    // Production exposes the consolidated gamification summary. The legacy
    // /progress/overview path is not registered and is mapped to HTTP 500 by
    // Spring's global handler, so probing it first breaks both mobile pages.
    final response = await _dio.get(ApiConstants.gamificationSummary);

    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<ProgressStatsDto>.fromJson(
      data,
      (json) => ProgressStatsDto.fromJson(
        json is Map<String, dynamic> ? json : <String, dynamic>{},
      ),
    );
  }

  Future<TransactionResponse<List<ActivityDayDto>>>
  getProgressActivity() async {
    final response = await _dio.get(ApiConstants.gamificationSummary);
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};
    return TransactionResponse<List<ActivityDayDto>>.fromJson(data, (json) {
      final stats = ProgressStatsDto.fromJson(
        json is Map<String, dynamic> ? json : <String, dynamic>{},
      );
      return stats.recentActivities;
    });
  }

  Future<TransactionResponse<List<BadgeItemDto>>> getAwards() async {
    // Awards are the BADGE entries from the deployed EXP store catalog.
    final response = await _dio.get(ApiConstants.gamificationStore);
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{'result': response.data};

    return TransactionResponse<List<BadgeItemDto>>.fromJson(data, (json) {
      final list = (json is Map && json['items'] is List)
          ? (json['items'] as List)
                .where((item) => item is Map && item['itemType'] == 'BADGE')
                .map((item) {
                  final badge = (item as Map).cast<String, dynamic>();
                  final isOwned = badge['isOwned'] as bool? ?? false;
                  return <String, dynamic>{
                    ...badge,
                    'category': 'Huy hiệu EXP',
                    'maxLevel': 1,
                    'currentValue': isOwned ? 1 : 0,
                    'targetValue': 1,
                    'isUnlocked': isOwned,
                    // Store ownership is already the final state; production
                    // has no separate celebration endpoint for these badges.
                    'isCelebrated': true,
                  };
                })
                .toList()
          : [];
      return list
          .map((e) => BadgeItemDto.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<TransactionResponse<void>> celebrateAward(String code) async {
    final response = await _dio.post(ApiConstants.awardCelebrated(code));
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};

    return TransactionResponse<void>.fromJson(data, (_) {});
  }

  Future<TransactionResponse<void>> freezeStreak() async {
    final response = await _dio.post(
      ApiConstants.gamificationRedeem,
      data: {'itemKey': 'streak_freeze'},
    );
    final data = response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : <String, dynamic>{};

    return TransactionResponse<void>.fromJson(data, (_) {});
  }
}
