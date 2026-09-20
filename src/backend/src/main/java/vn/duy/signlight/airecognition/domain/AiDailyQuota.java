package vn.duy.signlight.airecognition.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Bộ đếm 5 lượt/ngày cho người dùng miễn phí (BR-A108). */
@Entity
@Table(name = "ai_daily_quota")
@IdClass(AiDailyQuotaId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDailyQuota {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "quota_date_local")
    private LocalDate quotaDateLocal;

    @Column(name = "used_count", nullable = false)
    private short usedCount;
}
