package vn.duy.signlight.billing.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "gift_code")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftCode {

    @Id
    @Column(length = 32)
    private String code;

    @Column(nullable = false, length = 128)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "premium_days", nullable = false)
    @Builder.Default
    private int premiumDays = 0;

    @Column(name = "ai_quota", nullable = false)
    @Builder.Default
    private int aiQuota = 0;

    @Column(name = "exp_reward", nullable = false)
    @Builder.Default
    private int expReward = 0;

    @Column(name = "max_uses", nullable = false)
    @Builder.Default
    private int maxUses = -1;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private int usedCount = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
