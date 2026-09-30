package vn.duy.signlight.gamification.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GamificationSummaryResult(
        int streakDays,
        int longestStreak,
        int freezeCount,
        boolean goalMetToday,
        short dailyGoalMinutes,
        BigDecimal totalMinutesLearned,
        int completedLessons,
        int signsMastered,
        int averageScore,
        List<DailyActivityDto> recentActivities,
        int expBalance,
        int aiBonusQuota,
        List<String> ownedBadges
) {
    public record DailyActivityDto(
            LocalDate date,
            BigDecimal minutes,
            short goalMinutes,
            boolean goalMet
    ) {}
}
