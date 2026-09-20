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

/** Chương — nhóm bài học, kết thúc bằng quiz đạt >= `quizPassPercent` (BR-A23). */
@Entity
@Table(name = "chapter")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chapter {

    @Id
    private UUID id;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "quiz_pass_percent", nullable = false)
    private short quizPassPercent;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
