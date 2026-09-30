package vn.duy.signlight.gamification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_quest_progress")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserQuestProgress {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "quest_id", nullable = false)
    private UUID questId;

    @Column(name = "current_count", nullable = false)
    @Builder.Default
    private int currentCount = 0;

    @Column(name = "is_completed", nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column(name = "is_claimed", nullable = false)
    @Builder.Default
    private boolean claimed = false;

    @Column(name = "reset_date", nullable = false)
    private LocalDate resetDate;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
