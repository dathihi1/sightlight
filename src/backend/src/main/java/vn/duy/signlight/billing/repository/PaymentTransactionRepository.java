package vn.duy.signlight.billing.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.billing.domain.PaymentTransaction;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByOrderCode(long orderCode);

    Optional<PaymentTransaction> findByOrderRef(String orderRef);

    List<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT coalesce(sum(p.amount), 0) FROM PaymentTransaction p WHERE p.status = 'PAID'")
    long sumSuccessfulAmount();

    @Query("SELECT coalesce(sum(p.amount), 0) FROM PaymentTransaction p WHERE p.status = 'PAID'")
    long sumPaidAmount();

    @Query("""
            SELECT coalesce(sum(p.amount), 0) FROM PaymentTransaction p
            WHERE p.status = 'PAID' AND p.paidAt >= :from AND p.paidAt < :toExclusive
            """)
    long sumPaidAmountBetween(@Param("from") java.time.Instant from,
                              @Param("toExclusive") java.time.Instant toExclusive);

    long countByStatus(String status);
}
