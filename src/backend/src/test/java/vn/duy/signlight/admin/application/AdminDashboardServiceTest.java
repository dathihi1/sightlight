package vn.duy.signlight.admin.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.repository.SubscriptionRepository;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.gamification.repository.DailyActivityRepository;
import vn.duy.signlight.gamification.repository.QuestRepository;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.learning.repository.LessonCompletionRepository;

class AdminDashboardServiceTest {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant NOW = Instant.parse("2026-10-03T05:30:00Z");

    private AppUserRepository userRepository;
    private LessonCompletionRepository completionRepository;
    private SignAttemptRepository attemptRepository;
    private PaymentTransactionRepository paymentRepository;
    private SubscriptionRepository subscriptionRepository;
    private QuestRepository questRepository;
    private DailyActivityRepository activityRepository;
    private LessonRepository lessonRepository;
    private AdminDashboardService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(AppUserRepository.class);
        completionRepository = mock(LessonCompletionRepository.class);
        attemptRepository = mock(SignAttemptRepository.class);
        paymentRepository = mock(PaymentTransactionRepository.class);
        subscriptionRepository = mock(SubscriptionRepository.class);
        questRepository = mock(QuestRepository.class);
        activityRepository = mock(DailyActivityRepository.class);
        lessonRepository = mock(LessonRepository.class);
        service = new AdminDashboardService(
                userRepository,
                completionRepository,
                attemptRepository,
                paymentRepository,
                subscriptionRepository,
                questRepository,
                activityRepository,
                lessonRepository,
                Clock.fixed(NOW, BUSINESS_ZONE));
    }

    @Test
    void allTimeStatsUsePaidRevenueEffectiveActiveSubscriptionsAndBoundedRecentActivity() {
        when(userRepository.count()).thenReturn(120L);
        when(activityRepository.countDistinctActiveUsersByDate(LocalDate.of(2026, 10, 3))).thenReturn(14L);
        when(completionRepository.count()).thenReturn(80L);
        when(attemptRepository.count()).thenReturn(250L);
        when(paymentRepository.sumPaidAmount()).thenReturn(990_000L);
        when(subscriptionRepository.countCurrentlyEffective(eq("ACTIVE"), eq(NOW), eq(NOW))).thenReturn(7L);
        when(questRepository.count()).thenReturn(9L);
        when(completionRepository.findAll(any(Pageable.class))).thenReturn(Page.empty());

        var result = service.getStats(null, null);

        assertEquals(990_000L, result.totalRevenueVnd());
        assertEquals(7L, result.activeSubscriptionsCount());
        assertEquals("ALL_TIME", result.metricScope());
        assertEquals("Asia/Ho_Chi_Minh", result.timeZone());
        assertEquals(null, result.rangeFrom());
        assertEquals(null, result.rangeToExclusive());

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(completionRepository).findAll(pageable.capture());
        assertEquals(10, pageable.getValue().getPageSize());
        assertEquals("createdAt: DESC", pageable.getValue().getSort().toString());
    }

    @Test
    void dateRangeUsesVietnamMidnightAndExclusiveDayAfterToDate() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        Instant fromInstant = Instant.parse("2026-08-31T17:00:00Z");
        Instant toExclusive = Instant.parse("2026-09-30T17:00:00Z");
        when(completionRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(fromInstant, toExclusive)).thenReturn(31L);
        when(attemptRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(fromInstant, toExclusive)).thenReturn(62L);
        when(paymentRepository.sumPaidAmountBetween(fromInstant, toExclusive)).thenReturn(123_000L);
        when(subscriptionRepository.countCurrentlyEffective("ACTIVE", NOW, NOW)).thenReturn(4L);
        when(completionRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                eq(fromInstant), eq(toExclusive), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        var result = service.getStats(from, to);

        assertEquals(31L, result.totalLessonsCompleted());
        assertEquals(62L, result.totalAiAttempts());
        assertEquals(123_000L, result.totalRevenueVnd());
        assertEquals("DATE_RANGE", result.metricScope());
        assertEquals(fromInstant, result.rangeFrom());
        assertEquals(toExclusive, result.rangeToExclusive());
        verify(paymentRepository).sumPaidAmountBetween(fromInstant, toExclusive);
    }

    @Test
    void rejectsPartialReversedAndOverlongDateRanges() {
        assertThrows(BusinessException.class, () -> service.getStats(LocalDate.of(2026, 9, 1), null));
        assertThrows(BusinessException.class, () -> service.getStats(LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 1)));
        assertThrows(BusinessException.class, () -> service.getStats(LocalDate.of(2025, 1, 1), LocalDate.of(2026, 10, 1)));
    }
}
