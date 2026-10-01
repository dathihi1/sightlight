package vn.duy.signlight.advertising.web.dto;

public record AdRewardResult(
        String rewardType,
        int amountGranted,
        int newExpBalance,
        int newAiBonusQuota,
        String message
) {}
