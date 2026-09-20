package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.Lesson;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByChapterIdInAndStatusOrderByOrderIndexAsc(
            Collection<UUID> chapterIds, String status);
}
