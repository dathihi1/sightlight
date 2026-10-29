package vn.duy.signlight.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.config.FirebaseMessagingProperties;
import vn.duy.signlight.notification.domain.Notification;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.domain.PushOutbox;
import vn.duy.signlight.notification.repository.PushInstallationRepository;
import vn.duy.signlight.notification.repository.PushOutboxRepository;

@ExtendWith(MockitoExtension.class)
class PushOutboxServiceTest {

    @Mock
    private PushInstallationRepository installationRepository;

    @Mock
    private PushOutboxRepository outboxRepository;

    @Test
    void enqueueCreatesOneDeliveryForEachActiveInstallation() {
        UUID userId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();
        UUID installationId = UUID.randomUUID();
        Notification notification = Notification.builder()
                .id(notificationId)
                .userId(userId)
                .title("Tiến độ mới")
                .content("Bạn vừa hoàn thành bài học")
                .type("PROGRESS")
                .targetUrl("/hoc")
                .build();
        PushInstallation installation = PushInstallation.builder()
                .id(installationId)
                .userId(userId)
                .permissionStatus("GRANTED")
                .revokedAt(null)
                .build();
        when(installationRepository.findByUserIdAndRevokedAtIsNull(userId))
                .thenReturn(List.of(installation));
        PushOutboxService service = new PushOutboxService(
                installationRepository,
                outboxRepository,
                properties(true));

        service.enqueue(notification);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PushOutbox>> deliveries = ArgumentCaptor.forClass(List.class);
        verify(outboxRepository).saveAll(deliveries.capture());
        PushOutbox delivery = deliveries.getValue().getFirst();
        assertEquals(notificationId, delivery.getNotificationId());
        assertEquals(installationId, delivery.getInstallationId());
        assertEquals(PushOutbox.PENDING, delivery.getStatus());
        assertEquals("/hoc", delivery.getTargetUrl());
    }

    @Test
    void enqueueIsNoOpWhenFirebaseIsDisabled() {
        PushOutboxService service = new PushOutboxService(
                installationRepository,
                outboxRepository,
                properties(false));

        service.enqueue(Notification.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .title("title")
                .content("body")
                .type("SYSTEM")
                .createdAt(Instant.now())
                .build());

        verify(installationRepository, never()).findByUserIdAndRevokedAtIsNull(any());
        verify(outboxRepository, never()).saveAll(any());
    }

    private FirebaseMessagingProperties properties(boolean enabled) {
        return new FirebaseMessagingProperties(enabled, "project", "", 5_000, 50, 5);
    }
}
