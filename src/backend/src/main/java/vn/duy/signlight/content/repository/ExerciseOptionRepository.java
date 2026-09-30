package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.ExerciseOption;

public interface ExerciseOptionRepository extends JpaRepository<ExerciseOption, UUID> {

    List<ExerciseOption> findByExerciseIdInOrderByOrderIndexAsc(Collection<UUID> exerciseIds);

    List<ExerciseOption> findByExerciseIdOrderByOrderIndexAsc(UUID exerciseId);

    void deleteByExerciseId(UUID exerciseId);
}
