package vn.duy.signlight.billing.web.dto;

public record RedeemCodeResult(
        String code,
        String title,
        String description,
        int expReward,
        int aiQuota,
        int premiumDays,
        String message
) {}
