package vn.duy.signlight.airecognition.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.airecognition.domain.AiModelVersion;

public interface AiModelVersionRepository extends JpaRepository<AiModelVersion, UUID> {

    Optional<AiModelVersion> findByActiveTrue();

    Optional<AiModelVersion> findByVersionCode(String versionCode);
}
