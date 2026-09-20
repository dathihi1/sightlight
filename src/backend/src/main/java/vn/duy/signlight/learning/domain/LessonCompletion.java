package vn.duy.signlight.learning.domain;

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

/** Ghi nhận hoàn thành bài học. Idempotent theo `idempotencyKey` (BR-A31). */
@Entity
@Table(name = "lesson_completion")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonCompletion {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Column(name = "idempotency_key", nullable = false)
    private UUID idempotencyKey;

    @Column(name = "score_percent", nullable = false)
    private short scorePercent;

    /** Đã áp trần 15 phút mỗi bài (BR-A46). */
    @Column(name = "effective_minutes", nullable = false)
    private BigDecimal effectiveMinutes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
