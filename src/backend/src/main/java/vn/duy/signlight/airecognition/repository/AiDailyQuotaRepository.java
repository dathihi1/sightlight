package vn.duy.signlight.airecognition.repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.airecognition.domain.AiDailyQuota;
import vn.duy.signlight.airecognition.domain.AiDailyQuotaId;

public interface AiDailyQuotaRepository extends JpaRepository<AiDailyQuota, AiDailyQuotaId> {

    Optional<AiDailyQuota> findByUserIdAndQuotaDateLocal(UUID userId, LocalDate quotaDateLocal);
}
