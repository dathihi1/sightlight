package vn.duy.signlight.gamification.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.gamification.domain.DailyActivity;
import vn.duy.signlight.gamification.domain.Streak;
import vn.duy.signlight.gamification.repository.DailyActivityRepository;
import vn.duy.signlight.gamification.repository.StreakRepository;

/**
 * Cộng phút học và cập nhật streak (FR-23, FR-26).
 *
 * <p>Mọi phép tính ngày dùng <b>ngày địa phương của người học</b> (BR-A44) — không dùng ngày của máy
 * chủ, nếu không người ở múi giờ khác sẽ mất streak oan.
 *
 * <p>Phần <i>tụt</i> streak khi bỏ một ngày do job nửa đêm đảm nhiệm (LLD §4.3) — chưa thuộc lát cắt
 * này. Ở đây chỉ xử lý nhánh "vừa học xong".
 */
@Service
public class StreakService {

    private final StreakRepository streakRepository;
    private final DailyActivityRepository dailyActivityRepository;

    public StreakService(StreakRepository streakRepository,
            DailyActivityRepository dailyActivityRepository) {
        this.streakRepository = streakRepository;
        this.dailyActivityRepository = dailyActivityRepository;
    }

    /** Ghi nhận thời gian học và trả trạng thái streak sau khi cập nhật. */
    @Transactional
    public Snapshot recordActivity(UUID userId, UUID courseId, String timezone,
            BigDecimal minutes, short goalMinutes) {
        LocalDate today = LocalDate.now(ZoneId.of(timezone));

        DailyActivity activity = dailyActivityRepository
                .findByUserIdAndCourseIdAndActivityDateLocal(userId, courseId, today)
                .orElseGet(() -> DailyActivity.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .activityDateLocal(today)
                        .totalMinutes(BigDecimal.ZERO)
                        .goalMinutes(goalMinutes)
                        .goalMet(false)
                        .build());

        boolean wasGoalMet = activity.isGoalMet();
        activity.setTotalMinutes(activity.getTotalMinutes().add(minutes));
        activity.setGoalMet(activity.getTotalMinutes()
                .compareTo(BigDecimal.valueOf(activity.getGoalMinutes())) >= 0);
        dailyActivityRepository.save(activity);

        Streak streak = streakRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseGet(() -> Streak.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .currentCount(0)
                        .longestCount(0)
                        .freezeCount((short) 0)
                        .build());

        // Chỉ tăng streak đúng một lần cho mỗi ngày đạt mục tiêu.
        if (!wasGoalMet && activity.isGoalMet() && !today.equals(streak.getLastGoalMetDateLocal())) {
            boolean continuesYesterday = streak.getLastGoalMetDateLocal() != null
                    && streak.getLastGoalMetDateLocal().plusDays(1).equals(today);
            streak.setCurrentCount(continuesYesterday ? streak.getCurrentCount() + 1 : 1);
            streak.setLastGoalMetDateLocal(today);
            if (streak.getCurrentCount() > streak.getLongestCount()) {
                streak.setLongestCount(streak.getCurrentCount());
            }
        }
        streakRepository.save(streak);

        return new Snapshot(streak.getCurrentCount(), streak.getLongestCount(),
                streak.getFreezeCount(), activity.isGoalMet());
    }

    @Transactional(readOnly = true)
    public Snapshot current(UUID userId, UUID courseId, String timezone) {
        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        boolean goalMetToday = dailyActivityRepository
                .findByUserIdAndCourseIdAndActivityDateLocal(userId, courseId, today)
                .map(DailyActivity::isGoalMet)
                .orElse(false);
        return streakRepository.findByUserIdAndCourseId(userId, courseId)
                .map(streak -> new Snapshot(streak.getCurrentCount(), streak.getLongestCount(),
                        streak.getFreezeCount(), goalMetToday))
                .orElseGet(() -> new Snapshot(0, 0, 0, goalMetToday));
    }

    /** Ảnh chụp streak để trả ra API. */
    public record Snapshot(int current, int longest, int freezeCount, boolean goalMetToday) {
    }
}
