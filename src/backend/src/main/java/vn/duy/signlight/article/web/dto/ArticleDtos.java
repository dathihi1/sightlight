package vn.duy.signlight.article.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ArticleDtos {

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
