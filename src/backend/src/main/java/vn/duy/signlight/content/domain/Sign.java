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

/** Ký hiệu trong từ điển. Chỉ bản ghi PUBLISHED mới ra kết quả tìm kiếm (BR-A42). */
@Entity
@Table(name = "sign")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sign {

    @Id
    private UUID id;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(nullable = false, length = 100)
    private String word;

    @Column(length = 255)
    private String meaning;

    @Column(name = "word_class", length = 24)
    private String wordClass;

    @Column(length = 64)
    private String topic;

    @Column(name = "cefr_level", length = 4)
    private String cefrLevel;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;
}
