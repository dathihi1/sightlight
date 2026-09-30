package vn.duy.signlight.gamification.web.dto;

public record RedeemStoreItemResult(
        String itemKey,
        String itemType,
        int expDeducted,
        int newExpBalance,
        int newAiBonusQuota,
        int newFreezeCount,
        int newLessonPassCount,
        String message
) {
    public RedeemStoreItemResult(String itemKey, String itemType, int expDeducted, int newExpBalance, int newAiBonusQuota, int newFreezeCount, String message) {
        this(itemKey, itemType, expDeducted, newExpBalance, newAiBonusQuota, newFreezeCount, 0, message);
    }
}
