class ActivityDay {
  const ActivityDay({
    required this.date,
    required this.minutes,
    required this.goalMinutes,
    required this.goalMet,
  });

  final DateTime date;
  final double minutes;
  final int goalMinutes;
  final bool goalMet;

  ActivityDay copyWith({
    DateTime? date,
    double? minutes,
    int? goalMinutes,
    bool? goalMet,
  }) {
    return ActivityDay(
      date: date ?? this.date,
      minutes: minutes ?? this.minutes,
      goalMinutes: goalMinutes ?? this.goalMinutes,
      goalMet: goalMet ?? this.goalMet,
    );
  }
}

class ProgressStats {
  const ProgressStats({
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
  final List<ActivityDay> recentActivities;

  ProgressStats copyWith({
    int? streakDays,
    int? longestStreak,
    int? freezeCount,
    bool? goalMetToday,
    int? dailyGoalMinutes,
    double? totalMinutesLearned,
    int? completedLessons,
    int? signsMastered,
    int? averageScore,
    int? expBalance,
    int? aiBonusQuota,
    int? unlockTicketCount,
    List<ActivityDay>? recentActivities,
  }) {
    return ProgressStats(
      streakDays: streakDays ?? this.streakDays,
      longestStreak: longestStreak ?? this.longestStreak,
      freezeCount: freezeCount ?? this.freezeCount,
      goalMetToday: goalMetToday ?? this.goalMetToday,
      dailyGoalMinutes: dailyGoalMinutes ?? this.dailyGoalMinutes,
      totalMinutesLearned: totalMinutesLearned ?? this.totalMinutesLearned,
      completedLessons: completedLessons ?? this.completedLessons,
      signsMastered: signsMastered ?? this.signsMastered,
      averageScore: averageScore ?? this.averageScore,
      expBalance: expBalance ?? this.expBalance,
      aiBonusQuota: aiBonusQuota ?? this.aiBonusQuota,
      unlockTicketCount: unlockTicketCount ?? this.unlockTicketCount,
      recentActivities: recentActivities ?? this.recentActivities,
    );
  }
}
