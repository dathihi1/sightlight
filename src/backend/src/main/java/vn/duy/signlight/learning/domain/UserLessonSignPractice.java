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

/** Một từ đã được người học luyện bằng Camera AI trước khi vào lesson chính. */
@Entity
@Table(name = "user_lesson_sign_practice")
@IdClass(UserLessonSignPracticeId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLessonSignPractice {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "lesson_id")
    private UUID lessonId;

    @Id
    @Column(name = "sign_id")
    private UUID signId;

    @Column(name = "attempt_id")
    private UUID attemptId;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt;
}
