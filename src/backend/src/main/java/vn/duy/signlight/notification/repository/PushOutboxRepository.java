package vn.duy.signlight.notification.repository;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.notification.domain.PushOutbox;

public interface PushOutboxRepository extends JpaRepository<PushOutbox, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p from PushOutbox p
            where (p.status = 'PENDING' and p.nextAttemptAt <= :now)
               or (p.status = 'PROCESSING' and p.updatedAt <= :staleBefore)
            order by p.createdAt asc
            """)
    List<PushOutbox> findReadyForDelivery(
            @Param("now") Instant now,
            @Param("staleBefore") Instant staleBefore,
            Pageable pageable);
}
