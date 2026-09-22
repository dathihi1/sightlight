package vn.duy.signlight.identity.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.identity.domain.AuthIdentity;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, UUID> {

    Optional<AuthIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);

    Optional<AuthIdentity> findByUserIdAndProvider(UUID userId, String provider);
}
