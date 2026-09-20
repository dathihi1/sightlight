package vn.duy.signlight.learning.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.learning.domain.ExerciseAttempt;

public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, UUID> {

    long countByUserIdAndExerciseId(UUID userId, UUID exerciseId);

    List<ExerciseAttempt> findByUserIdAndExerciseIdInOrderByAttemptNoAsc(
            UUID userId, java.util.Collection<UUID> exerciseIds);
}
