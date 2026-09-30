package vn.duy.signlight.article.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.duy.signlight.article.domain.Article;

@Repository
public interface ArticleRepository extends JpaRepository<Article, UUID> {

    List<Article> findAllByOrderByCreatedAtDesc();

    List<Article> findAllByPublishedTrueOrderByCreatedAtDesc();

    Optional<Article> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
