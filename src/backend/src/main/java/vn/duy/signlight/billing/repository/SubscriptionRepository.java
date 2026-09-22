package vn.duy.signlight.billing.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Subscription> findFirstByUserIdAndStatusOrderByExpiresAtDesc(UUID userId, String status);
}
