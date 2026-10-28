package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.content.domain.Lesson;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByChapterIdInAndStatusOrderByOrderIndexAsc(
            Collection<UUID> chapterIds, String status);

    Optional<Lesson> findByChapterIdAndStableKey(UUID chapterId, String stableKey);

    List<Lesson> findByChapterIdAndStatus(UUID chapterId, String status);

    boolean existsByChapterIdAndStableKey(UUID chapterId, String stableKey);

    List<Lesson> findByChapterIdOrderByOrderIndexAsc(UUID chapterId);

    @Query("""
            select l from Lesson l
            join Chapter ch on ch.id = l.chapterId
            join Unit u on u.id = ch.unitId
            where u.courseId = :courseId
              and (:unitId is null or u.id = :unitId)
              and (:chapterId is null or ch.id = :chapterId)
              and (:search is null or lower(l.title) like lower(concat('%', :search, '%'))
                   or lower(l.stableKey) like lower(concat('%', :search, '%')))
              and (:status is null or l.status = :status)
              and (:type is null or l.type = :type)
              and (:level is null or l.targetLevel = :level)
            """)
    Page<Lesson> adminSearch(
            @Param("courseId") UUID courseId,
            @Param("unitId") UUID unitId,
            @Param("chapterId") UUID chapterId,
            @Param("search") String search,
            @Param("status") String status,
            @Param("type") String type,
            @Param("level") String level,
            Pageable pageable);
}
