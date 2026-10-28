package vn.duy.signlight.learning.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.learning.domain.LessonCompletion;

public interface LessonCompletionRepository extends JpaRepository<LessonCompletion, UUID> {

    Optional<LessonCompletion> findByUserIdAndIdempotencyKey(UUID userId, UUID idempotencyKey);

    long countByUserId(UUID userId);

    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant from, Instant toExclusive);

    Page<LessonCompletion> findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
            Instant from, Instant toExclusive, Pageable pageable);
}
