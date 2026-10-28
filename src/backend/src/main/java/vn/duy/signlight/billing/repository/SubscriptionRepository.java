package vn.duy.signlight.billing.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.billing.domain.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Subscription> findFirstByUserIdAndStatusOrderByExpiresAtDesc(UUID userId, String status);

    boolean existsByUserIdAndStatusAndExpiresAtAfter(UUID userId, String status, Instant now);

    @Query("""
            SELECT count(s) FROM Subscription s
            WHERE s.status = :status AND s.activatedAt <= :activatedAt AND s.expiresAt > :expiresAt
            """)
    long countCurrentlyEffective(@Param("status") String status,
                                 @Param("activatedAt") Instant activatedAt,
                                 @Param("expiresAt") Instant expiresAt);
}
