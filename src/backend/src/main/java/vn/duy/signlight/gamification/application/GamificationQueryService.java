package vn.duy.signlight.gamification.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.gamification.domain.DailyActivity;
import vn.duy.signlight.gamification.domain.UserInventory;
import vn.duy.signlight.gamification.repository.DailyActivityRepository;
import vn.duy.signlight.gamification.repository.UserInventoryRepository;
import vn.duy.signlight.gamification.web.dto.GamificationSummaryResult;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.domain.UserPreference;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserPreferenceRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;

@Service
public class GamificationQueryService {

    private final StreakService streakService;
    private final DailyActivityRepository dailyActivityRepository;
    private final UserLessonStateRepository userLessonStateRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final AuthService authService;

    public GamificationQueryService(
            StreakService streakService,
            DailyActivityRepository dailyActivityRepository,
            UserLessonStateRepository userLessonStateRepository,
            UserPreferenceRepository userPreferenceRepository,
            UserProfileRepository userProfileRepository,
            UserInventoryRepository userInventoryRepository,
            AuthService authService) {
        this.streakService = streakService;
        this.dailyActivityRepository = dailyActivityRepository;
        this.userLessonStateRepository = userLessonStateRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.userProfileRepository = userProfileRepository;
        this.userInventoryRepository = userInventoryRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public GamificationSummaryResult summary(UUID userId, UUID courseId) {
        UserPreference preference = userPreferenceRepository.findById(userId).orElse(null);
        UUID resolvedCourseId = courseId != null ? courseId
                : (preference != null ? preference.getActiveCourseId() : null);

        String timezone;
        try {
            timezone = authService.timezoneOf(userId);
        } catch (Exception ex) {
            timezone = "Asia/Ho_Chi_Minh";
        }
        if (timezone == null || timezone.isBlank()) {
            timezone = "Asia/Ho_Chi_Minh";
        }

        short goalMinutes = preference != null ? preference.getDailyGoalMinutes() : (short) 15;

        StreakService.Snapshot streakSnapshot = resolvedCourseId != null
                ? streakService.current(userId, resolvedCourseId, timezone)
                : new StreakService.Snapshot(0, 0, 0, false);

        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        LocalDate sevenDaysAgo = today.minusDays(6);

        List<DailyActivity> recentActivities = resolvedCourseId != null
                ? dailyActivityRepository
                        .findByUserIdAndCourseIdAndActivityDateLocalGreaterThanEqualOrderByActivityDateLocalAsc(
                                userId, resolvedCourseId, sevenDaysAgo)
                : List.of();

        BigDecimal totalMinutes = recentActivities.stream()
                .map(DailyActivity::getTotalMinutes)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<GamificationSummaryResult.DailyActivityDto> activityDtos = recentActivities.stream()
                .map(a -> new GamificationSummaryResult.DailyActivityDto(
                        a.getActivityDateLocal(),
                        a.getTotalMinutes(),
                        a.getGoalMinutes(),
                        a.isGoalMet()))
                .toList();

        List<UserLessonState> lessonStates = userLessonStateRepository.findByUserId(userId);
        int completedLessons = 0;
        int scoreSum = 0;
        int scoredCount = 0;

        for (UserLessonState state : lessonStates) {
            if (UserLessonState.COMPLETED.equals(state.getStatus())) {
                completedLessons++;
                if (state.getBestScorePercent() != null) {
                    scoreSum += state.getBestScorePercent();
                    scoredCount++;
                }
            }
        }

        int avgScore = scoredCount > 0 ? Math.round((float) scoreSum / scoredCount) : 0;
        int signsMastered = completedLessons * 6;

        UserProfile profile = userProfileRepository.findById(userId).orElse(null);
        int expBalance = profile != null ? profile.getExpBalance() : 0;
        int aiBonusQuota = profile != null ? profile.getAiBonusQuota() : 0;

        List<String> ownedBadges = userInventoryRepository.findByUserId(userId).stream()
                .filter(i -> "BADGE".equals(i.getItemType()))
                .map(UserInventory::getItemKey)
                .toList();

        return new GamificationSummaryResult(
                streakSnapshot.current(),
                streakSnapshot.longest(),
                streakSnapshot.freezeCount(),
                streakSnapshot.goalMetToday(),
                goalMinutes,
                totalMinutes,
                completedLessons,
                signsMastered,
                avgScore,
                activityDtos,
                expBalance,
                aiBonusQuota,
                ownedBadges
        );
    }
}
