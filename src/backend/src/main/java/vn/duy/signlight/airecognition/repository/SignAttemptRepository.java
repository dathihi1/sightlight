package vn.duy.signlight.airecognition.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.airecognition.domain.SignAttempt;

public interface SignAttemptRepository extends JpaRepository<SignAttempt, UUID> {

    List<SignAttempt> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<SignAttempt> findByUserIdAndTargetSignIdOrderByCreatedAtDesc(
            UUID userId, UUID targetSignId, Pageable pageable);
}
