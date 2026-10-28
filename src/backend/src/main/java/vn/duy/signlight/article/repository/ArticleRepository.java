package vn.duy.signlight.article.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.duy.signlight.article.domain.Article;

@Repository
public interface ArticleRepository extends JpaRepository<Article, UUID> {

    List<Article> findAllByOrderByCreatedAtDesc();

    List<Article> findAllByPublishedTrueOrderByCreatedAtDesc();

    Optional<Article> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    @Query(value = """
            select a.id as id, a.slug as slug, a.title_vi as titleVi, a.title_en as titleEn,
                   a.excerpt_vi as excerptVi, a.excerpt_en as excerptEn, a.author as author,
                   a.category as category, a.category_label_vi as categoryLabelVi,
                   a.category_label_en as categoryLabelEn, a.tags as tags,
                   a.thumbnail_url as thumbnailUrl, a.read_time_vi as readTimeVi,
                   a.read_time_en as readTimeEn, a.is_published as published,
                   a.views_count as viewsCount, a.order_index as orderIndex,
                   a.created_at as createdAt, a.updated_at as updatedAt
            from article a
            where (:search is null or lower(a.title_vi) like lower(concat('%', :search, '%'))
                   or lower(coalesce(a.title_en, '')) like lower(concat('%', :search, '%'))
                   or lower(a.slug) like lower(concat('%', :search, '%')))
              and (:category is null or a.category = :category)
              and (:tag is null or exists (
                    select 1 from unnest(string_to_array(coalesce(a.tags, ''), ',')) token
                    where lower(btrim(token)) = lower(:tag)))
              and (:published is null or a.is_published = :published)
            """,
            countQuery = """
            select count(*) from article a
            where (:search is null or lower(a.title_vi) like lower(concat('%', :search, '%'))
                   or lower(coalesce(a.title_en, '')) like lower(concat('%', :search, '%'))
                   or lower(a.slug) like lower(concat('%', :search, '%')))
              and (:category is null or a.category = :category)
              and (:tag is null or exists (
                    select 1 from unnest(string_to_array(coalesce(a.tags, ''), ',')) token
                    where lower(btrim(token)) = lower(:tag)))
              and (:published is null or a.is_published = :published)
            """, nativeQuery = true)
    Page<ArticleSummaryProjection> adminSearch(
            @Param("search") String search,
            @Param("category") String category,
            @Param("tag") String tag,
            @Param("published") Boolean published,
            Pageable pageable);

    @Query(value = """
            select btrim(token) as name, count(*) as count
            from article a
            cross join lateral unnest(string_to_array(coalesce(a.tags, ''), ',')) token
            where btrim(token) <> '' and (:onlyPublished = false or a.is_published = true)
            group by lower(btrim(token)), btrim(token)
            order by count(*) desc, lower(btrim(token)) asc
            """, nativeQuery = true)
    List<TagCountProjection> aggregateTags(@Param("onlyPublished") boolean onlyPublished);

    interface ArticleSummaryProjection {
        UUID getId();
        String getSlug();
        String getTitleVi();
        String getTitleEn();
        String getExcerptVi();
        String getExcerptEn();
        String getAuthor();
        String getCategory();
        String getCategoryLabelVi();
        String getCategoryLabelEn();
        String getTags();
        String getThumbnailUrl();
        String getReadTimeVi();
        String getReadTimeEn();
        boolean isPublished();
        int getViewsCount();
        int getOrderIndex();
        Instant getCreatedAt();
        Instant getUpdatedAt();
    }

    interface TagCountProjection {
        String getName();
        long getCount();
    }
}
