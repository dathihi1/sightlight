package vn.duy.signlight.notification.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.config.FirebaseMessagingProperties;
import vn.duy.signlight.notification.domain.PushInstallation;
import vn.duy.signlight.notification.repository.PushInstallationRepository;

@Service
public class PushInstallationService {

    private final PushInstallationRepository repository;
    private final FirebaseMessagingProperties properties;

    public PushInstallationService(
            PushInstallationRepository repository,
            FirebaseMessagingProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional
    public RegistrationResult register(UUID userId, String firebaseInstallationId) {
        if (!properties.enabled()) {
            return new RegistrationResult(false, false);
        }

        Instant now = Instant.now();
        PushInstallation installation = repository.findByFirebaseInstallationId(firebaseInstallationId)
                .orElseGet(() -> PushInstallation.builder()
                        .id(UUID.randomUUID())
                        .firebaseInstallationId(firebaseInstallationId)
                        .createdAt(now)
                        .build());
        installation.setUserId(userId);
        installation.setPlatform("WEB");
        installation.setPermissionStatus("GRANTED");
        installation.setLastSeenAt(now);
        installation.setRevokedAt(null);
        installation.setUpdatedAt(now);
        repository.save(installation);
        return new RegistrationResult(true, true);
    }

    @Transactional
    public boolean revoke(UUID userId, String firebaseInstallationId) {
        Optional<PushInstallation> match = repository.findByFirebaseInstallationId(firebaseInstallationId)
                .filter(installation -> installation.getUserId().equals(userId));
        if (match.isEmpty()) {
            return false;
        }
        revoke(match.get(), Instant.now());
        return true;
    }

    @Transactional
    public void revokeById(UUID installationId) {
        repository.findById(installationId).ifPresent(installation -> revoke(installation, Instant.now()));
    }

    @Transactional(readOnly = true)
    public Optional<PushInstallation> findActive(UUID installationId) {
        return repository.findById(installationId)
                .filter(installation -> installation.getRevokedAt() == null)
                .filter(installation -> "GRANTED".equals(installation.getPermissionStatus()));
    }

    private void revoke(PushInstallation installation, Instant now) {
        installation.setPermissionStatus("REVOKED");
        installation.setRevokedAt(now);
        installation.setUpdatedAt(now);
        repository.save(installation);
    }

    public record RegistrationResult(boolean enabled, boolean registered) {}
}
