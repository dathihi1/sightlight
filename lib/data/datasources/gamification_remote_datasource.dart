import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/transaction_response.dart';
import '../models/gamification/progress_stats_dto.dart';
import '../models/gamification/award_dto.dart';

class GamificationRemoteDataSource {
  GamificationRemoteDataSource(this._dio);

  final Dio _dio;

  Future<TransactionResponse<ProgressStatsDto>> getProgressOverview() async {
    Response response;
    try {
      response = await _dio.get(ApiConstants.progressOverview);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        response = await _dio.get(ApiConstants.gamificationSummary);
      } else {
        rethrow;
      }
    }

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

  Future<TransactionResponse<List<ActivityDayDto>>> getProgressActivity() async {
    Response response;
    try {
      response = await _dio.get(ApiConstants.progressActivity);
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{'result': response.data};

      return TransactionResponse<List<ActivityDayDto>>.fromJson(
        data,
        (json) {
          final list = json is List ? json : [];
          return list
              .map((e) => ActivityDayDto.fromJson(e as Map<String, dynamic>))
              .toList();
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Fallback to gamification summary
        final summaryResp = await _dio.get(ApiConstants.gamificationSummary);
        final sumData = summaryResp.data is Map<String, dynamic>
            ? summaryResp.data as Map<String, dynamic>
            : <String, dynamic>{'result': summaryResp.data};
        final stats = ProgressStatsDto.fromJson(
          (sumData['result'] as Map<String, dynamic>?) ?? {},
        );
        return TransactionResponse<List<ActivityDayDto>>(
          errorCode: '00000',
          result: stats.recentActivities,
        );
      }
      rethrow;
    }
  }

  Future<TransactionResponse<List<BadgeItemDto>>> getAwards() async {
    Response response;
    try {
      response = await _dio.get(ApiConstants.awards);
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{'result': response.data};

      return TransactionResponse<List<BadgeItemDto>>.fromJson(
        data,
        (json) {
          final list = json is List
              ? json
              : (json is Map && json['badges'] is List)
                  ? json['badges'] as List
                  : (json is Map && json['items'] is List)
                      ? json['items'] as List
                      : [];
          return list
              .map((e) => BadgeItemDto.fromJson(e as Map<String, dynamic>))
              .toList();
        },
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // Fallback to store
        response = await _dio.get(ApiConstants.gamificationStore);
        final data = response.data is Map<String, dynamic>
            ? response.data as Map<String, dynamic>
            : <String, dynamic>{'result': response.data};

        return TransactionResponse<List<BadgeItemDto>>.fromJson(
          data,
          (json) {
            final list = (json is Map && json['items'] is List)
                ? json['items'] as List
                : [];
            return list
                .map((e) => BadgeItemDto.fromJson(e as Map<String, dynamic>))
                .toList();
          },
        );
      }
      rethrow;
    }
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
