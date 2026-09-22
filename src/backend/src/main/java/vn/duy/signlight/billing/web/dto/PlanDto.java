package vn.duy.signlight.billing.web.dto;

public record PlanDto(
        String id,
        String name,
        String description,
        int durationDays,
        int priceVnd,
        boolean active) {
}
