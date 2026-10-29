package vn.duy.signlight.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.config.FirebaseMessagingProperties;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.repository.PushInstallationRepository;

@ExtendWith(MockitoExtension.class)
class PushInstallationServiceTest {

    @Mock
    private PushInstallationRepository repository;

    @Test
    void registerCreatesActiveWebInstallation() {
        UUID userId = UUID.randomUUID();
        String fid = "firebase-installation-id";
        when(repository.findByFirebaseInstallationId(fid)).thenReturn(Optional.empty());
        PushInstallationService service = new PushInstallationService(repository, properties(true));

        PushInstallationService.RegistrationResult result = service.register(userId, fid);

        ArgumentCaptor<PushInstallation> saved = ArgumentCaptor.forClass(PushInstallation.class);
        verify(repository).save(saved.capture());
        assertTrue(result.enabled());
        assertTrue(result.registered());
        assertEquals(userId, saved.getValue().getUserId());
        assertEquals(fid, saved.getValue().getFirebaseInstallationId());
        assertEquals("WEB", saved.getValue().getPlatform());
        assertEquals("GRANTED", saved.getValue().getPermissionStatus());
        assertNull(saved.getValue().getRevokedAt());
    }

    @Test
    void disabledFirebaseDoesNotPersistInstallation() {
        PushInstallationService service = new PushInstallationService(repository, properties(false));

        PushInstallationService.RegistrationResult result =
                service.register(UUID.randomUUID(), "firebase-installation-id");

        assertFalse(result.enabled());
        assertFalse(result.registered());
        verify(repository, never()).save(any());
    }

    @Test
    void revokeOnlyAffectsInstallationOwnedByCurrentUser() {
        UUID ownerId = UUID.randomUUID();
        PushInstallation installation = PushInstallation.builder()
                .id(UUID.randomUUID())
                .userId(ownerId)
                .firebaseInstallationId("fid")
                .permissionStatus("GRANTED")
                .lastSeenAt(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        when(repository.findByFirebaseInstallationId("fid")).thenReturn(Optional.of(installation));
        PushInstallationService service = new PushInstallationService(repository, properties(true));

        assertFalse(service.revoke(UUID.randomUUID(), "fid"));
        verify(repository, never()).save(any());
    }

    private FirebaseMessagingProperties properties(boolean enabled) {
        return new FirebaseMessagingProperties(enabled, "project", "", 5_000, 50, 5);
    }
}
