package vn.duy.signlight.admin.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class AdminUserDtos {

    public record UserSummary(
            UUID id,
            String email,
            String displayName,
            String status,
            Set<String> roles,
            int expBalance,
            int aiBonusQuota,
            boolean isPremium,
            String planName,
            Instant createdAt
    ) {}

    public record UserListResult(
            List<UserSummary> items,
            int totalPages,
            long totalElements,
            int currentPage
    ) {}

    public record UserDetailResult(
            UUID id,
            String email,
            String displayName,
            String status,
            Set<String> roles,
            int expBalance,
            int aiBonusQuota,
            boolean isPremium,
            String activePlanName,
            Instant planExpiresAt,
            int currentStreak,
            int longestStreak,
            long completedLessonsCount,
            Instant createdAt,
            Instant emailVerifiedAt
    ) {}

    public record UpdateStatusRequest(
            String status
    ) {}

    public record UpdateRolesRequest(
            Set<String> roles
    ) {}

    public record AdjustBalanceRequest(
            int expDelta,
            int aiQuotaDelta,
            String reason
    ) {}
}
