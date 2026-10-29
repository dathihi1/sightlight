package vn.duy.signlight.notification.application;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.domain.PushOutbox;

@Component
@ConditionalOnProperty(prefix = "signlight.firebase", name = "enabled", havingValue = "true")
public class PushOutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(PushOutboxWorker.class);

    private final PushOutboxService outboxService;
    private final PushInstallationService installationService;
    private final PushGateway pushGateway;

    public PushOutboxWorker(
            PushOutboxService outboxService,
            PushInstallationService installationService,
            PushGateway pushGateway) {
        this.outboxService = outboxService;
        this.installationService = installationService;
        this.pushGateway = pushGateway;
    }

    @Scheduled(fixedDelayString = "${signlight.firebase.worker-delay-ms:5000}")
    public void deliverPending() {
        List<PushOutbox> batch = outboxService.claimBatch();
        for (PushOutbox delivery : batch) {
            deliver(delivery);
        }
    }

    void deliver(PushOutbox delivery) {
        PushInstallation installation = installationService.findActive(delivery.getInstallationId()).orElse(null);
        if (installation == null) {
            outboxService.markFailed(delivery.getId(), "INSTALLATION_REVOKED", true);
            return;
        }
        try {
            String messageId = pushGateway.send(installation.getFirebaseInstallationId(), delivery);
            outboxService.markSent(delivery.getId(), messageId);
        } catch (PushDeliveryException ex) {
            if (ex.invalidInstallation()) {
                installationService.revokeById(delivery.getInstallationId());
            }
            outboxService.markFailed(delivery.getId(), ex.errorCode(), ex.invalidInstallation());
            log.warn("fcm_delivery_failed outbox_id={} code={}", delivery.getId(), ex.errorCode());
        } catch (RuntimeException ex) {
            outboxService.markFailed(delivery.getId(), "UNEXPECTED_SEND_FAILURE", false);
            log.warn("fcm_delivery_failed outbox_id={} code=UNEXPECTED_SEND_FAILURE", delivery.getId());
        }
    }
}
