package vn.duy.signlight.gamification.web.dto;

import java.util.List;

public record StoreCatalogResult(
        int expBalance,
        int aiBonusQuota,
        int freezeCount,
        int lessonPassCount,
        List<StoreItemDto> items,
        List<String> ownedBadges
) {
    public record StoreItemDto(
            String itemKey,
            String itemType,
            String title,
            String description,
            int costExp,
            boolean isOwned
    ) {}

    public StoreCatalogResult(int expBalance, int aiBonusQuota, int freezeCount, List<StoreItemDto> items, List<String> ownedBadges) {
        this(expBalance, aiBonusQuota, freezeCount, 0, items, ownedBadges);
    }
}
