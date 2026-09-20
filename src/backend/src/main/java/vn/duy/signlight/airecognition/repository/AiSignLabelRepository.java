package vn.duy.signlight.airecognition.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.airecognition.domain.AiSignLabel;

public interface AiSignLabelRepository extends JpaRepository<AiSignLabel, UUID> {

    List<AiSignLabel> findByModelVersionId(UUID modelVersionId);

    List<AiSignLabel> findByModelVersionIdAndEnabledTrue(UUID modelVersionId);

    Optional<AiSignLabel> findByModelVersionIdAndStableSignId(UUID modelVersionId, String stableSignId);

    Optional<AiSignLabel> findByModelVersionIdAndSignIdAndEnabledTrue(UUID modelVersionId, UUID signId);
}
