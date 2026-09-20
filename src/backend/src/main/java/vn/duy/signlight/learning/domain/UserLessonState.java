package vn.duy.signlight.learning.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Tiến độ của một người học trên một bài học. */
@Entity
@Table(name = "user_lesson_state")
@IdClass(UserLessonStateId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLessonState {

    public static final String NOT_STARTED = "NOT_STARTED";
    public static final String IN_PROGRESS = "IN_PROGRESS";
    public static final String COMPLETED = "COMPLETED";

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "lesson_id")
    private UUID lessonId;

    @Column(nullable = false, length = 16)
    private String status;

    /** Điểm tính theo **lần trả lời đầu tiên** của mỗi câu (BR-A20). */
    @Column(name = "best_score_percent")
    private Short bestScorePercent;

    @Column(name = "first_try_perfect", nullable = false)
    private boolean firstTryPerfect;

    /** Vào lại đúng câu đang dở (FR-12 4a). */
    @Column(name = "current_exercise_index", nullable = false)
    private short currentExerciseIndex;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
