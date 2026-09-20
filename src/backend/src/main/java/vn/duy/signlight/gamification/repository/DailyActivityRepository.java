package vn.duy.signlight.gamification.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.gamification.domain.DailyActivity;
import vn.duy.signlight.gamification.domain.DailyActivityId;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, DailyActivityId> {

    Optional<DailyActivity> findByUserIdAndCourseIdAndActivityDateLocal(
            UUID userId, UUID courseId, LocalDate date);

    List<DailyActivity> findByUserIdAndCourseIdAndActivityDateLocalGreaterThanEqualOrderByActivityDateLocalAsc(
            UUID userId, UUID courseId, LocalDate from);
}
