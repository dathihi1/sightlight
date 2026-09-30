package vn.duy.signlight.gamification.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.gamification.domain.UserQuestProgress;

public interface UserQuestProgressRepository extends JpaRepository<UserQuestProgress, UUID> {
    List<UserQuestProgress> findByUserIdAndResetDate(UUID userId, LocalDate resetDate);
    Optional<UserQuestProgress> findByUserIdAndQuestIdAndResetDate(UUID userId, UUID questId, LocalDate resetDate);
}
