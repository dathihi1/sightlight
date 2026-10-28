package vn.duy.signlight.advertising.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ad_reward_claim")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdRewardClaim {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "reward_date_local", nullable = false)
    private LocalDate rewardDateLocal;

    @Column(name = "reward_type", nullable = false, length = 20)
    private String rewardType;

    @Column(length = 64)
    private String placement;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
