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

/**
 * Một phiên bản mô hình nhận dạng.
 *
 * <p>Ngưỡng tin cậy nằm ở đây chứ không nằm trong mã nguồn, để chỉnh được mà không phải triển khai
 * lại (BR-A112). Chỉ một bản `active` tại một thời điểm (BR-A127).
 */
@Entity
@Table(name = "ai_model_version")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelVersion {

    @Id
    private UUID id;

    @Column(name = "version_code", nullable = false, length = 64)
    private String versionCode;

    @Column(name = "num_classes", nullable = false)
    private short numClasses;

    @Column(name = "sequence_length", nullable = false)
    private short sequenceLength;

    @Column(name = "feature_dim", nullable = false)
    private short featureDim;

    @Column(name = "schema_version", nullable = false, length = 32)
    private String schemaVersion;

    @Column(name = "confidence_threshold", nullable = false)
    private BigDecimal confidenceThreshold;

    @Column(name = "confidence_margin", nullable = false)
    private BigDecimal confidenceMargin;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "synced_at", nullable = false)
    private Instant syncedAt;
}
