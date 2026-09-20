package vn.duy.signlight.identity.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.identity.domain.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
}
