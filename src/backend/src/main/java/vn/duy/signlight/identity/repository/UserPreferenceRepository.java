package vn.duy.signlight.identity.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.identity.domain.UserPreference;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, UUID> {
}
