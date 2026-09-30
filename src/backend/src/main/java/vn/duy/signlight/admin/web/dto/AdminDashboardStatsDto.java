package vn.duy.signlight.admin.web.dto;

import java.util.List;

public record AdminDashboardStatsDto(
        long totalUsers,
        long activeUsersToday,
        long totalLessonsCompleted,
        long totalAiAttempts,
        long totalRevenueVnd,
        long activeSubscriptionsCount,
        long totalQuestsAvailable,
        List<RecentActivityItem> recentCompletions
) {
    public record RecentActivityItem(
            String lessonTitle,
            String userEmail,
            int scorePercent,
            java.time.Instant completedAt
    ) {}
}
