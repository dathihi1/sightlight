package vn.duy.signlight.billing.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.PaymentWebhookLog;

public interface PaymentWebhookLogRepository extends JpaRepository<PaymentWebhookLog, UUID> {
}
