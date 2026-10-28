package vn.duy.signlight.advertising.repository;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.advertising.domain.AdRewardClaim;

public interface AdRewardClaimRepository extends JpaRepository<AdRewardClaim, UUID> {

    long countByUserIdAndRewardDateLocal(UUID userId, LocalDate rewardDateLocal);
}
