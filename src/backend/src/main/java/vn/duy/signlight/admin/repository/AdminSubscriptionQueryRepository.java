package vn.duy.signlight.admin.repository;

import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;
import vn.duy.signlight.billing.domain.Subscription;

@Repository
public class AdminSubscriptionQueryRepository {

    private final EntityManager entityManager;

    public AdminSubscriptionQueryRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<Subscription> findActiveByUserIds(Collection<UUID> userIds, Instant now) {
        if (userIds.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("""
                select s from Subscription s
                where s.userId in :userIds
                  and s.status = 'ACTIVE'
                  and s.activatedAt <= :now
                  and s.expiresAt > :now
                order by s.userId asc, s.expiresAt desc, s.id asc
                """, Subscription.class)
                .setParameter("userIds", userIds)
                .setParameter("now", now)
                .getResultList();
    }
}
