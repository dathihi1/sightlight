package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.content.domain.Sign;

public interface SignRepository extends JpaRepository<Sign, UUID> {

    List<Sign> findByStatusOrderByWordAsc(String status);

    org.springframework.data.domain.Page<Sign> findByTopicAndStatusOrderByWordAsc(
            String topic, String status, Pageable pageable);

    List<Sign> findByIdInAndStatus(Collection<UUID> ids, String status);

    Optional<Sign> findByIdAndStatus(UUID id, String status);

    /**
     * Tìm kiếm từ điển (FR-21, ADR-05): full-text không dấu, cộng gợi ý trigram cho lỗi chính tả.
     *
     * <p>Chỉ trả ký hiệu đã `PUBLISHED` (BR-A42). Truy vấn native vì `tsvector`/`similarity` không có
     * tương đương trong JPQL.
     */
    @Query(value = """
            SELECT * FROM sign s
            WHERE s.status = 'PUBLISHED'
              AND (s.search_vector @@ plainto_tsquery('simple', signlight_unaccent(:query))
                   OR signlight_unaccent(s.word) % signlight_unaccent(:query))
            ORDER BY ts_rank(s.search_vector,
                             plainto_tsquery('simple', signlight_unaccent(:query))) DESC,
                     similarity(signlight_unaccent(s.word), signlight_unaccent(:query)) DESC,
                     s.word ASC
            """,
            countQuery = """
            SELECT count(*) FROM sign s
            WHERE s.status = 'PUBLISHED'
              AND (s.search_vector @@ plainto_tsquery('simple', signlight_unaccent(:query))
                   OR signlight_unaccent(s.word) % signlight_unaccent(:query))
            """,
            nativeQuery = true)
    org.springframework.data.domain.Page<Sign> search(@Param("query") String query, Pageable pageable);

    @Query("select s.topic as topic, count(s) as total from Sign s "
            + "where s.status = 'PUBLISHED' and s.topic is not null "
            + "group by s.topic order by s.topic asc")
    List<TopicCount> countByTopic();

    @Query("SELECT s FROM Sign s WHERE (:topic IS NULL OR s.topic = :topic) "
            + "AND (:status IS NULL OR s.status = :status) "
            + "AND (:level IS NULL OR s.cefrLevel = :level) "
            + "AND (CAST(:search AS string) IS NULL OR LOWER(s.word) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(s.meaning) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    org.springframework.data.domain.Page<Sign> adminSearch(
            @Param("search") String search,
            @Param("topic") String topic,
            @Param("status") String status,
            @Param("level") String level,
            Pageable pageable);

    @Query("SELECT DISTINCT s.topic FROM Sign s WHERE s.topic IS NOT NULL AND s.topic != '' ORDER BY s.topic ASC")
    List<String> findAllDistinctTopics();

    /** Chiếu kết quả gom nhóm chủ đề (FR-21). */
    interface TopicCount {
        String getTopic();

        long getTotal();
    }
}
