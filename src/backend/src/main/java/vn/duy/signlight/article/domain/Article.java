package vn.duy.signlight.article.domain;

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

@Entity
@Table(name = "article")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Article {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "title_vi", nullable = false, length = 255)
    private String titleVi;

    @Column(name = "title_en", length = 255)
    private String titleEn;

    @Column(name = "excerpt_vi", length = 1000)
    private String excerptVi;

    @Column(name = "excerpt_en", length = 1000)
    private String excerptEn;

    @Column(name = "content_vi", columnDefinition = "TEXT")
    private String contentVi;

    @Column(name = "content_en", columnDefinition = "TEXT")
    private String contentEn;

    @Column(length = 100)
    private String author;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "category_label_vi", length = 100)
    private String categoryLabelVi;

    @Column(name = "category_label_en", length = 100)
    private String categoryLabelEn;

    /** Danh sách tags ngăn cách bởi dấu phẩy, ví dụ: "VSL, Giao tiếp, Mẹo học" */
    @Column(length = 255)
    private String tags;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "read_time_vi", length = 50)
    private String readTimeVi;

    @Column(name = "read_time_en", length = 50)
    private String readTimeEn;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean published = true;

    @Column(name = "views_count", nullable = false)
    @Builder.Default
    private int viewsCount = 0;

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private int orderIndex = 0;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;
}
