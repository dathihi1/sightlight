package vn.duy.signlight.airecognition.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ánh xạ nhãn của mô hình sang ký hiệu trong từ điển (BR-A124).
 *
 * <p>`signId == null` là **nhãn mồ côi**: mô hình biết nhãn đó nhưng từ điển chưa có ký hiệu tương
 * ứng → không kích hoạt, không hiện nút chấm AI (BR-A125).
 */
@Entity
@Table(name = "ai_sign_label")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSignLabel {

    @Id
    private UUID id;

    @Column(name = "model_version_id", nullable = false)
    private UUID modelVersionId;

    @Column(name = "label_index", nullable = false)
    private short labelIndex;

    @Column(name = "raw_label", nullable = false, length = 100)
    private String rawLabel;

    @Column(name = "stable_sign_id", nullable = false, length = 100)
    private String stableSignId;

    @Column(name = "sign_id")
    private UUID signId;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled;
}
