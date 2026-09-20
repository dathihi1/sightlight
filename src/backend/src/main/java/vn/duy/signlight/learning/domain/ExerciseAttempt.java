package vn.duy.signlight.learning.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Một lượt trả lời. `correct` do **server** chấm, không nhận từ client (BR-A19, AC-12.3). */
@Entity
@Table(name = "exercise_attempt")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseAttempt {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "exercise_id", nullable = false)
    private UUID exerciseId;

    @Column(name = "attempt_no", nullable = false)
    private short attemptNo;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "answer_payload")
    private String answerPayload;

    /** Chỉ dùng cho thống kê — tuyệt đối không dùng để chấm điểm. */
    @Column(name = "client_elapsed_ms")
    private Integer clientElapsedMs;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
