package vn.duy.signlight.gamification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.gamification.domain.DailyActivity;
import vn.duy.signlight.gamification.repository.DailyActivityRepository;
import vn.duy.signlight.gamification.web.dto.GamificationSummaryResult;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.domain.UserPreference;
import vn.duy.signlight.identity.repository.UserPreferenceRepository;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;

class GamificationQueryServiceTest {

    private StreakService streakService;
    private DailyActivityRepository dailyActivityRepository;
    private UserLessonStateRepository userLessonStateRepository;
    private UserPreferenceRepository userPreferenceRepository;
    private vn.duy.signlight.identity.repository.UserProfileRepository userProfileRepository;
    private vn.duy.signlight.gamification.repository.UserInventoryRepository userInventoryRepository;
    private AuthService authService;
    private GamificationQueryService queryService;

    @BeforeEach
    void setUp() {
        streakService = mock(StreakService.class);
        dailyActivityRepository = mock(DailyActivityRepository.class);
        userLessonStateRepository = mock(UserLessonStateRepository.class);
        userPreferenceRepository = mock(UserPreferenceRepository.class);
        userProfileRepository = mock(vn.duy.signlight.identity.repository.UserProfileRepository.class);
        userInventoryRepository = mock(vn.duy.signlight.gamification.repository.UserInventoryRepository.class);
        authService = mock(AuthService.class);

        queryService = new GamificationQueryService(
                streakService,
                dailyActivityRepository,
                userLessonStateRepository,
                userPreferenceRepository,
                userProfileRepository,
                userInventoryRepository,
                authService
        );
    }

    @Test
    @DisplayName("summary calculates stats correctly when user has progress")
    void summary_withProgress() {
        UUID userId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();

        UserPreference preference = UserPreference.builder()
                .userId(userId)
                .activeCourseId(courseId)
                .dailyGoalMinutes((short) 15)
                .build();
        when(userPreferenceRepository.findById(userId)).thenReturn(Optional.of(preference));
        when(authService.timezoneOf(userId)).thenReturn("Asia/Ho_Chi_Minh");

        when(streakService.current(eq(userId), eq(courseId), eq("Asia/Ho_Chi_Minh")))
                .thenReturn(new StreakService.Snapshot(5, 10, 1, true));

        DailyActivity activity = DailyActivity.builder()
                .userId(userId)
                .courseId(courseId)
                .activityDateLocal(LocalDate.now())
                .totalMinutes(BigDecimal.valueOf(20))
                .goalMinutes((short) 15)
                .goalMet(true)
                .build();
        when(dailyActivityRepository
                .findByUserIdAndCourseIdAndActivityDateLocalGreaterThanEqualOrderByActivityDateLocalAsc(
                        eq(userId), eq(courseId), any(LocalDate.class)))
                .thenReturn(List.of(activity));

        UserLessonState state1 = UserLessonState.builder()
                .userId(userId)
                .lessonId(UUID.randomUUID())
                .status(UserLessonState.COMPLETED)
                .bestScorePercent((short) 90)
                .build();
        UserLessonState state2 = UserLessonState.builder()
                .userId(userId)
                .lessonId(UUID.randomUUID())
                .status(UserLessonState.COMPLETED)
                .bestScorePercent((short) 100)
                .build();
        when(userLessonStateRepository.findByUserId(userId)).thenReturn(List.of(state1, state2));

        GamificationSummaryResult result = queryService.summary(userId, courseId);

        assertNotNull(result);
        assertEquals(5, result.streakDays());
        assertEquals(10, result.longestStreak());
        assertEquals(1, result.freezeCount());
        assertEquals(true, result.goalMetToday());
        assertEquals(2, result.completedLessons());
        assertEquals(95, result.averageScore());
        assertEquals(12, result.signsMastered()); // Math.max(2*6, 12) = 12
        assertEquals(1, result.recentActivities().size());
    }

    @Test
    @DisplayName("summary handles fresh user with no activity gracefully")
    void summary_freshUser() {
        UUID userId = UUID.randomUUID();
        when(userPreferenceRepository.findById(userId)).thenReturn(Optional.empty());
        when(authService.timezoneOf(userId)).thenReturn("Asia/Ho_Chi_Minh");
        when(userLessonStateRepository.findByUserId(userId)).thenReturn(List.of());

        GamificationSummaryResult result = queryService.summary(userId, null);

        assertNotNull(result);
        assertEquals(0, result.streakDays());
        assertEquals(0, result.completedLessons());
        assertEquals(0, result.averageScore());
        assertEquals(0, result.signsMastered());
        assertEquals(0, result.recentActivities().size());
    }
}
