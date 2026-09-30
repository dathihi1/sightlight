package vn.duy.signlight.gamification.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.gamification.domain.Streak;
import vn.duy.signlight.gamification.domain.StreakId;

public interface StreakRepository extends JpaRepository<Streak, StreakId> {

    Optional<Streak> findByUserIdAndCourseId(UUID userId, UUID courseId);
    java.util.List<Streak> findByUserId(UUID userId);
}
