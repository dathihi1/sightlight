package vn.duy.signlight.billing.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.GiftCode;

public interface GiftCodeRepository extends JpaRepository<GiftCode, String> {
    Optional<GiftCode> findByCodeIgnoreCaseAndActiveTrue(String code);
}
