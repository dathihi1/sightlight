package vn.duy.signlight.notification.application;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.config.FirebaseMessagingProperties;
import vn.duy.signlight.notification.domain.Notification;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.domain.PushOutbox;
import vn.duy.signlight.notification.repository.PushInstallationRepository;
import vn.duy.signlight.notification.repository.PushOutboxRepository;

@Service
public class PushOutboxService {

    private static final Duration PROCESSING_TIMEOUT = Duration.ofMinutes(5);

    private final PushInstallationRepository installationRepository;
    private final PushOutboxRepository outboxRepository;
    private final FirebaseMessagingProperties properties;

    public PushOutboxService(
            PushInstallationRepository installationRepository,
            PushOutboxRepository outboxRepository,
            FirebaseMessagingProperties properties) {
        this.installationRepository = installationRepository;
        this.outboxRepository = outboxRepository;
        this.properties = properties;
    }

    @Transactional
    public void enqueue(Notification notification) {
        if (!properties.enabled()) {
            return;
        }
        Instant now = Instant.now();
        List<PushOutbox> deliveries = installationRepository
                .findByUserIdAndRevokedAtIsNull(notification.getUserId())
                .stream()
                .filter(installation -> "GRANTED".equals(installation.getPermissionStatus()))
                .map(installation -> toOutbox(notification, installation, now))
                .toList();
        if (!deliveries.isEmpty()) {
            outboxRepository.saveAll(deliveries);
        }
    }

    @Transactional
    public List<PushOutbox> claimBatch() {
        Instant now = Instant.now();
        List<PushOutbox> batch = outboxRepository.findReadyForDelivery(
                now,
                now.minus(PROCESSING_TIMEOUT),
                PageRequest.of(0, properties.batchSize()));
        batch.forEach(item -> {
            item.setStatus(PushOutbox.PROCESSING);
            item.setAttemptCount(item.getAttemptCount() + 1);
            item.setUpdatedAt(now);
        });
        return outboxRepository.saveAll(batch);
    }

    @Transactional
    public void markSent(UUID outboxId, String firebaseMessageId) {
        outboxRepository.findById(outboxId).ifPresent(item -> {
            Instant now = Instant.now();
            item.setStatus(PushOutbox.SENT);
            item.setFirebaseMessageId(limit(firebaseMessageId, 255));
            item.setLastErrorCode(null);
            item.setProcessedAt(now);
            item.setUpdatedAt(now);
            outboxRepository.save(item);
        });
    }

    @Transactional
    public void markFailed(UUID outboxId, String errorCode, boolean permanent) {
        outboxRepository.findById(outboxId).ifPresent(item -> {
            Instant now = Instant.now();
            boolean exhausted = item.getAttemptCount() >= properties.maxAttempts();
            item.setStatus(permanent || exhausted ? PushOutbox.FAILED : PushOutbox.PENDING);
            item.setLastErrorCode(limit(errorCode, 100));
            item.setNextAttemptAt(now.plus(retryDelay(item.getAttemptCount())));
            item.setProcessedAt(permanent || exhausted ? now : null);
            item.setUpdatedAt(now);
            outboxRepository.save(item);
        });
    }

    private PushOutbox toOutbox(Notification notification, PushInstallation installation, Instant now) {
        return PushOutbox.builder()
                .id(UUID.randomUUID())
                .notificationId(notification.getId())
                .installationId(installation.getId())
                .title(notification.getTitle())
                .body(notification.getContent())
                .notificationType(notification.getType())
                .targetUrl(notification.getTargetUrl())
                .status(PushOutbox.PENDING)
                .attemptCount(0)
                .nextAttemptAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Duration retryDelay(int attemptCount) {
        long seconds = Math.min(3_600, 30L * (1L << Math.min(attemptCount, 6)));
        return Duration.ofSeconds(seconds);
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
