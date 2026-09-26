package vn.duy.signlight.content.domain;

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

/** Bài học. Đổi thứ tự KHÔNG ảnh hưởng tiến độ đã có (BR-A78). */
@Entity
@Table(name = "lesson")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

    @Id
    private UUID id;

    @Column(name = "chapter_id", nullable = false)
    private UUID chapterId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "estimated_minutes", nullable = false)
    private short estimatedMinutes;

    @Column(name = "curiosity_id")
    private UUID curiosityId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;

    @Column(name = "stable_key", length = 200)
    private String stableKey;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 64)
    private String topic;

    @Column(name = "target_level", length = 20)
    private String targetLevel;

    @Column(name = "content_version", nullable = false)
    private int contentVersion = 1;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "published_at")
    private Instant publishedAt;
}
