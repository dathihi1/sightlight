package vn.duy.signlight.gamification.web.dto;

public record RedeemStoreItemResult(
        String itemKey,
        String itemType,
        int expDeducted,
        int newExpBalance,
        int newAiBonusQuota,
        int newFreezeCount,
        String message
) {}
