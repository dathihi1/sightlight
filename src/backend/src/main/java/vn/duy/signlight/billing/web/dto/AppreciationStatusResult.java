package vn.duy.signlight.billing.web.dto;

public record AppreciationStatusResult(
        boolean claimed,
        String planId,
        boolean isPremium
) {}
