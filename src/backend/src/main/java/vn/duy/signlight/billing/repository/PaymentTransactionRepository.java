package vn.duy.signlight.billing.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByOrderCode(long orderCode);

    Optional<PaymentTransaction> findByOrderRef(String orderRef);

    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
