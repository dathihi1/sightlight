package vn.duy.signlight.learning.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.learning.domain.LessonCompletion;

public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, UUID> {

    Optional<LessonCompletion> findByUserIdAndIdempotencyKey(UUID userId, UUID idempotencyKey);
}
