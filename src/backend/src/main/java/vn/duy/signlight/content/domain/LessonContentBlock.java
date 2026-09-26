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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Khối nội dung trong bài học.
 *
 * <p>Các block được hiển thị trước/giữa/sau phần luyện tập để cung cấp:
 * <ul>
 *   <li>Giới thiệu và mục tiêu bài học</li>
 *   <li>Thông tin chi tiết về ký hiệu</li>
 *   <li>Mẹo ghi nhớ và phát âm</li>
 *   <li>Ví dụ và hội thoại</li>
 *   <li>Tóm tắt và điểm chính</li>
 * </ul>
 *
 * <p><b>Security:</b> Chỉ trả blocks có {@code status = PUBLISHED} ra public API.
 * Không bao giờ lưu đáp án hoặc logic chấm điểm trong blocks.
 */
@Entity
@Table(name = "lesson_content_block")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LessonContentBlock {

    @Id
    private UUID id;

    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Column(name = "stable_key", nullable = false, length = 200)
    private String stableKey;

    @Column(name = "block_type", nullable = false, length = 32)
    private String blockType;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @Column(length = 200)
    private String title;

    @Column(name = "body_text", columnDefinition = "TEXT")
    private String bodyText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String payload;

    @Column(name = "sign_id")
    private UUID signId;

    @Column(name = "media_ref", length = 512)
    private String mediaRef;

    @Column(name = "is_required", nullable = false)
    private boolean required = true;

    @Column(nullable = false, length = 20)
    private String status = "PUBLISHED";

    @Column(name = "content_version", nullable = false)
    private int contentVersion = 1;

    @Column(name = "is_seed", nullable = false)
    private boolean seed;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
