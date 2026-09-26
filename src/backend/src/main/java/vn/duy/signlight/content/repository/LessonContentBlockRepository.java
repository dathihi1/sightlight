package vn.duy.signlight.content.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.LessonContentBlock;

public interface LessonContentBlockRepository extends JpaRepository<LessonContentBlock, UUID> {

    List<LessonContentBlock> findByLessonIdAndStatusOrderByOrderIndexAsc(UUID lessonId, String status);

    List<LessonContentBlock> findByLessonIdOrderByOrderIndexAsc(UUID lessonId);

    Optional<LessonContentBlock> findByLessonIdAndStableKey(UUID lessonId, String stableKey);

    boolean existsByLessonIdAndStableKey(UUID lessonId, String stableKey);

    void deleteByLessonId(UUID lessonId);
}
