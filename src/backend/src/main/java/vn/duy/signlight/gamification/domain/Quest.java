package vn.duy.signlight.gamification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quest")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Quest {

    @Id
    private UUID id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(name = "quest_type", nullable = false, length = 20)
    private String questType;

    @Column(name = "target_action", nullable = false, length = 50)
    private String targetAction;

    @Column(name = "target_count", nullable = false)
    @Builder.Default
    private int targetCount = 1;

    @Column(name = "reward_exp", nullable = false)
    @Builder.Default
    private int rewardExp = 20;

    @Column(name = "reward_ai_bonus", nullable = false)
    @Builder.Default
    private int rewardAiBonus = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 0;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
