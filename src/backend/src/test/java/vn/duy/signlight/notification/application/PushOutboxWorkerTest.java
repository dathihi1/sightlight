package vn.duy.signlight.notification.application;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.domain.PushOutbox;

@ExtendWith(MockitoExtension.class)
class PushOutboxWorkerTest {

    @Mock
    private PushOutboxService outboxService;

    @Mock
    private PushInstallationService installationService;

    @Mock
    private PushGateway pushGateway;

    private PushOutboxWorker worker;

    @BeforeEach
    void setUp() {
        worker = new PushOutboxWorker(outboxService, installationService, pushGateway);
    }

    @Test
    void successfulDeliveryIsMarkedSent() {
        UUID outboxId = UUID.randomUUID();
        UUID installationId = UUID.randomUUID();
        PushOutbox delivery = PushOutbox.builder().id(outboxId).installationId(installationId).build();
        PushInstallation installation = PushInstallation.builder()
                .id(installationId)
                .firebaseInstallationId("fid")
                .build();
        when(installationService.findActive(installationId)).thenReturn(Optional.of(installation));
        when(pushGateway.send("fid", delivery)).thenReturn("projects/project/messages/123");

        worker.deliver(delivery);

        verify(outboxService).markSent(outboxId, "projects/project/messages/123");
    }

    @Test
    void invalidInstallationIsRevokedAndDeliveryIsPermanentFailure() {
        UUID outboxId = UUID.randomUUID();
        UUID installationId = UUID.randomUUID();
        PushOutbox delivery = PushOutbox.builder().id(outboxId).installationId(installationId).build();
        PushInstallation installation = PushInstallation.builder()
                .id(installationId)
                .firebaseInstallationId("fid")
                .build();
        when(installationService.findActive(installationId)).thenReturn(Optional.of(installation));
        when(pushGateway.send("fid", delivery))
                .thenThrow(new PushDeliveryException("UNREGISTERED", true, null));

        worker.deliver(delivery);

        verify(installationService).revokeById(installationId);
        verify(outboxService).markFailed(outboxId, "UNREGISTERED", true);
    }
}
