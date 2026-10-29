package vn.duy.signlight.notification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.notification.domain.PushInstallation;

public interface PushInstallationRepository extends JpaRepository<PushInstallation, UUID> {

    Optional<PushInstallation> findByFirebaseInstallationId(String firebaseInstallationId);

    List<PushInstallation> findByUserIdAndRevokedAtIsNull(UUID userId);
}
