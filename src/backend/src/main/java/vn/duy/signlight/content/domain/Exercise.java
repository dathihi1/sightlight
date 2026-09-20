package vn.duy.signlight.content.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Bài tập trong một bài học.
 *
 * <p>`correctAnswerText` và `correctOrder` là **đáp án** — chấm ở server và KHÔNG BAO GIỜ đi ra client
 * trước khi người học đã trả lời (BR-A19, AC-12.4, ADR-04).
 */
@Entity
@Table(name = "exercise")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exercise {

    @Id
    private UUID id;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 28)
    private String type;

    @Column(name = "sign_id")
    private UUID signId;

    @Column(name = "prompt_text", length = 500)
    private String promptText;

    @Column(name = "correct_answer_text", length = 200)
    private String correctAnswerText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "accepted_answers", nullable = false)
    private String acceptedAnswers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "correct_order")
    private String correctOrder;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
