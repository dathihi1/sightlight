package vn.duy.signlight.billing.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.GiftCodeRedemption;

public interface GiftCodeRedemptionRepository extends JpaRepository<GiftCodeRedemption, UUID> {
    boolean existsByUserIdAndCodeIgnoreCase(UUID userId, String code);
}
