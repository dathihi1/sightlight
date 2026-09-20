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

/** Lựa chọn của bài tập trắc nghiệm. `correct` KHÔNG BAO GIỜ được serialize ra client (AC-12.4). */
@Entity
@Table(name = "exercise_option")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExerciseOption {

    @Id
    private UUID id;

    @Column(name = "exercise_id", nullable = false)
    private UUID exerciseId;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "label_text", length = 200)
    private String labelText;

    @Column(name = "sign_video_id")
    private UUID signVideoId;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
