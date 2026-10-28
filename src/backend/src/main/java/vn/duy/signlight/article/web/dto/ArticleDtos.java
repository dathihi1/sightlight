package vn.duy.signlight.article.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ArticleDtos {

    public record ArticleSummary(
            UUID id,
            String slug,
            String titleVi,
            String titleEn,
            String excerptVi,
            String excerptEn,
            String author,
            String category,
            String categoryLabelVi,
            String categoryLabelEn,
            List<String> tags,
            String thumbnailUrl,
            String readTimeVi,
            String readTimeEn,
            boolean published,
            int viewsCount,
            int orderIndex,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ArticleListResult(
            List<ArticleSummary> items,
            int totalPages,
            long totalElements,
            int currentPage
    ) {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleItem {
        private UUID id;
        private String slug;
        private String titleVi;
        private String titleEn;
        private String excerptVi;
        private String excerptEn;
        private String contentVi;
        private String contentEn;
        private String author;
        private String category;
        private String categoryLabelVi;
        private String categoryLabelEn;
        private List<String> tags;
        private String thumbnailUrl;
        private String readTimeVi;
        private String readTimeEn;
        private boolean published;
        private int viewsCount;
        private int orderIndex;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleUpsertRequest {
        private String slug;
        private String titleVi;
        private String titleEn;
        private String excerptVi;
        private String excerptEn;
        private String contentVi;
        private String contentEn;
        private String author;
        private String category;
        private String categoryLabelVi;
        private String categoryLabelEn;
        private List<String> tags;
        private String thumbnailUrl;
        private String readTimeVi;
        private String readTimeEn;
        private Boolean published;
        private Integer orderIndex;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TagInfo {
        private String name;
        private long count;
    }
}
