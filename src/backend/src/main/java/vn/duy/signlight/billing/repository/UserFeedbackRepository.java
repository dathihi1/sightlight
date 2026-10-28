package vn.duy.signlight.billing.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.UserFeedback;

public interface UserFeedbackRepository extends JpaRepository<UserFeedback, UUID> {
}
