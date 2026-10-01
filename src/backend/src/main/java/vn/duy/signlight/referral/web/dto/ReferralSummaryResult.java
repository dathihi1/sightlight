package vn.duy.signlight.referral.web.dto;

import java.time.Instant;
import java.util.List;

public record ReferralSummaryResult(
        String referralCode,
        String referralLink,
        long invitedCount,
        int targetCount,
        boolean canClaimReward,
        boolean rewardClaimed,
        String referredByCode,
        List<ReferredFriendDto> invitedFriends
) {
    public record ReferredFriendDto(
            String displayName,
            String maskedEmail,
            Instant joinedAt
    ) {}
}
