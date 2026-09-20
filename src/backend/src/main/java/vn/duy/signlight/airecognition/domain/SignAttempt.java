package vn.duy.signlight.airecognition.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Một lượt luyện ký hiệu động đã được chấm.
 *
 * <p><b>NFR-12:</b> bảng này TUYỆT ĐỐI không có cột ảnh, video hay landmark thô. Thứ duy nhất được
 * lưu là kết luận và vài chỉ số chất lượng dạng số.
 */
@Entity
@Table(name = "sign_attempt")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignAttempt {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "target_sign_id", nullable = false)
    private UUID targetSignId;

    @Column(name = "model_version_id", nullable = false)
    private UUID modelVersionId;

    @Column(nullable = false, length = 24)
    private String status;

    /** Do backend quyết định, không lấy từ dịch vụ AI (ADR-09). */
    @Column(nullable = false)
    private boolean verified;

    @Column(name = "predicted_sign_id")
    private UUID predictedSignId;

    @Column
    private BigDecimal confidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "top3")
    private String top3;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quality")
    private String quality;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "counted_against_quota", nullable = false)
    private boolean countedAgainstQuota;

    @Column(name = "inference_latency_ms")
    private Integer inferenceLatencyMs;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
