package vn.duy.signlight.admin.web.dto;

import java.time.Instant;
import java.util.UUID;
import vn.duy.signlight.gamification.domain.Quest;

public class AdminQuestDtos {

    public record QuestItem(
            UUID id,
            String title,
            String description,
            String questType,
            String targetAction,
            int targetCount,
            int rewardExp,
            int rewardAiBonus,
            boolean active,
            int orderIndex,
            Instant createdAt
    ) {
        public static QuestItem from(Quest q) {
            return new QuestItem(
                    q.getId(),
                    q.getTitle(),
                    q.getDescription(),
                    q.getQuestType(),
                    q.getTargetAction(),
                    q.getTargetCount(),
                    q.getRewardExp(),
                    q.getRewardAiBonus(),
                    q.isActive(),
                    q.getOrderIndex(),
                    q.getCreatedAt()
            );
        }
    }

    public record QuestUpsertRequest(
            String title,
            String description,
            String questType,
            String targetAction,
            int targetCount,
            int rewardExp,
            int rewardAiBonus,
            boolean active,
            int orderIndex
    ) {}
}
