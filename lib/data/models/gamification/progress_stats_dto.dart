import '../../../domain/entities/progress_stats.dart';

class ActivityDayDto {
  const ActivityDayDto({
    required this.date,
    required this.minutes,
    required this.goalMinutes,
    required this.goalMet,
  });

  final DateTime date;
  final double minutes;
  final int goalMinutes;
  final bool goalMet;

  factory ActivityDayDto.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    final dateRaw = json['date'];
    if (dateRaw is String) {
      parsedDate = DateTime.tryParse(dateRaw) ?? DateTime.now();
    } else {
      parsedDate = DateTime.now();
    }

    return ActivityDayDto(
      date: parsedDate,
      minutes: (json['minutes'] as num?)?.toDouble() ?? 0.0,
      goalMinutes: (json['goalMinutes'] as num?)?.toInt() ?? 15,
      goalMet: (json['goalMet'] as bool?) ?? false,
    );
  }

  ActivityDay toEntity() {
    return ActivityDay(
      date: date,
      minutes: minutes,
      goalMinutes: goalMinutes,
      goalMet: goalMet,
    );
  }
}

class ProgressStatsDto {
  const ProgressStatsDto({
    this.streakDays = 0,
    this.longestStreak = 0,
    this.freezeCount = 0,
    this.goalMetToday = false,
    this.dailyGoalMinutes = 15,
    this.totalMinutesLearned = 0.0,
    this.completedLessons = 0,
    this.signsMastered = 0,
    this.averageScore = 0,
    this.expBalance = 0,
    this.aiBonusQuota = 0,
    this.unlockTicketCount = 0,
    this.recentActivities = const [],
  });

  final int streakDays;
  final int longestStreak;
  final int freezeCount;
  final bool goalMetToday;
  final int dailyGoalMinutes;
  final double totalMinutesLearned;
  final int completedLessons;
  final int signsMastered;
  final int averageScore;
  final int expBalance;
  final int aiBonusQuota;
  final int unlockTicketCount;
  final List<ActivityDayDto> recentActivities;

  factory ProgressStatsDto.fromJson(Map<String, dynamic> json) {
    final activitiesList =
        (json['recentActivities'] as List<dynamic>?)
            ?.map((e) => ActivityDayDto.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return ProgressStatsDto(
      streakDays:
          (json['streakDays'] as num?)?.toInt() ??
          (json['streak'] as num?)?.toInt() ??
          0,
      longestStreak: (json['longestStreak'] as num?)?.toInt() ?? 0,
      freezeCount: (json['freezeCount'] as num?)?.toInt() ?? 0,
      goalMetToday: (json['goalMetToday'] as bool?) ?? false,
      dailyGoalMinutes: (json['dailyGoalMinutes'] as num?)?.toInt() ?? 15,
      totalMinutesLearned:
          (json['totalMinutesLearned'] as num?)?.toDouble() ??
          (json['totalMinutes'] as num?)?.toDouble() ??
          0.0,
      completedLessons:
          (json['completedLessons'] as num?)?.toInt() ??
          (json['lessonsCompleted'] as num?)?.toInt() ??
          0,
      signsMastered: (json['signsMastered'] as num?)?.toInt() ?? 0,
      averageScore: (json['averageScore'] as num?)?.toInt() ?? 0,
      expBalance: (json['expBalance'] as num?)?.toInt() ?? 0,
      aiBonusQuota: (json['aiBonusQuota'] as num?)?.toInt() ?? 0,
      unlockTicketCount: (json['unlockTicketCount'] as num?)?.toInt() ?? 0,
      recentActivities: activitiesList,
    );
  }

  ProgressStats toEntity() {
    return ProgressStats(
      streakDays: streakDays,
      longestStreak: longestStreak,
      freezeCount: freezeCount,
      goalMetToday: goalMetToday,
      dailyGoalMinutes: dailyGoalMinutes,
      totalMinutesLearned: totalMinutesLearned,
      completedLessons: completedLessons,
      signsMastered: signsMastered,
      averageScore: averageScore,
      expBalance: expBalance,
      aiBonusQuota: aiBonusQuota,
      unlockTicketCount: unlockTicketCount,
      recentActivities: recentActivities.map((e) => e.toEntity()).toList(),
    );
  }
}
