package vn.duy.signlight.gamification.web.dto;

import java.util.UUID;

public record QuestProgressDto(
        UUID questId,
        String title,
        String description,
        String questType,
        String targetAction,
        int targetCount,
        int currentCount,
        int rewardExp,
        int rewardAiBonus,
        boolean completed,
        boolean claimed
) {}
