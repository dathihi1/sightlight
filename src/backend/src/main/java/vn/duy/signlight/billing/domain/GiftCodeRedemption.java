package vn.duy.signlight.billing.domain;

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
@Table(name = "gift_code_redemption")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GiftCodeRedemption {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(name = "redeemed_at", nullable = false)
    @Builder.Default
    private Instant redeemedAt = Instant.now();
}
