package vn.duy.signlight.content.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.Exercise;

public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    List<Exercise> findByLessonIdOrderByOrderIndexAsc(UUID lessonId);

    Optional<Exercise> findByLessonIdAndStableKey(UUID lessonId, String stableKey);

    List<Exercise> findByLessonIdAndActiveOrderByOrderIndexAsc(UUID lessonId, boolean active);

    boolean existsByLessonIdAndStableKey(UUID lessonId, String stableKey);
}
