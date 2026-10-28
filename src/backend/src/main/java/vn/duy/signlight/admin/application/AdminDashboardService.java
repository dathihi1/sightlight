package vn.duy.signlight.admin.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.admin.web.dto.AdminDashboardStatsDto;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.repository.SubscriptionRepository;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.gamification.repository.DailyActivityRepository;
import vn.duy.signlight.gamification.repository.QuestRepository;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.learning.domain.LessonCompletion;
import vn.duy.signlight.learning.repository.LessonCompletionRepository;

@Service
public class AdminDashboardService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final long MAX_RANGE_DAYS = 366;

    private final AppUserRepository userRepository;
    private final LessonCompletionRepository completionRepository;
    private final SignAttemptRepository attemptRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final QuestRepository questRepository;
    private final DailyActivityRepository activityRepository;
    private final LessonRepository lessonRepository;
    private final Clock clock;

    @Autowired
    public AdminDashboardService(
            AppUserRepository userRepository,
            LessonCompletionRepository completionRepository,
            SignAttemptRepository attemptRepository,
            PaymentTransactionRepository paymentRepository,
            SubscriptionRepository subscriptionRepository,
            QuestRepository questRepository,
            DailyActivityRepository activityRepository,
            LessonRepository lessonRepository) {
        this(userRepository, completionRepository, attemptRepository, paymentRepository, subscriptionRepository,
                questRepository, activityRepository, lessonRepository, Clock.system(BUSINESS_ZONE));
    }

    AdminDashboardService(
            AppUserRepository userRepository,
            LessonCompletionRepository completionRepository,
            SignAttemptRepository attemptRepository,
            PaymentTransactionRepository paymentRepository,
            SubscriptionRepository subscriptionRepository,
            QuestRepository questRepository,
            DailyActivityRepository activityRepository,
            LessonRepository lessonRepository,
            Clock clock) {
        this.userRepository = userRepository;
        this.completionRepository = completionRepository;
        this.attemptRepository = attemptRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.questRepository = questRepository;
        this.activityRepository = activityRepository;
        this.lessonRepository = lessonRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getStats() {
        return getStats(null, null);
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getStats(LocalDate from, LocalDate to) {
        validateRange(from, to);

        Instant now = clock.instant();
        boolean ranged = from != null;
        Instant rangeFrom = ranged ? from.atStartOfDay(BUSINESS_ZONE).toInstant() : null;
        Instant rangeToExclusive = ranged ? to.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant() : null;
        long totalUsers = userRepository.count();
        LocalDate today = LocalDate.now(clock.withZone(BUSINESS_ZONE));
        long activeToday = activityRepository.countDistinctActiveUsersByDate(today);

        long totalLessonsCompleted = ranged
                ? completionRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(rangeFrom, rangeToExclusive)
                : completionRepository.count();
        long totalAiAttempts = ranged
                ? attemptRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(rangeFrom, rangeToExclusive)
                : attemptRepository.count();
        long totalRevenue = ranged
                ? paymentRepository.sumPaidAmountBetween(rangeFrom, rangeToExclusive)
                : paymentRepository.sumPaidAmount();
        long activeSubs = subscriptionRepository.countCurrentlyEffective("ACTIVE", now, now);
        long totalQuests = questRepository.count();

        // Recent 10 completions
        PageRequest recentPage = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        var page = ranged
                ? completionRepository.findByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
                        rangeFrom, rangeToExclusive, recentPage)
                : completionRepository.findAll(recentPage);
        List<LessonCompletion> completions = page.getContent();
        List<UUID> userIds = completions.stream().map(LessonCompletion::getUserId).distinct().toList();
        List<UUID> lessonIds = completions.stream().map(LessonCompletion::getLessonId).distinct().toList();

        Map<UUID, AppUser> userMap = userIds.isEmpty() ? Map.of() : userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(AppUser::getId, Function.identity()));
        Map<UUID, Lesson> lessonMap = lessonIds.isEmpty() ? Map.of() : lessonRepository.findAllById(lessonIds).stream()
                .collect(Collectors.toMap(Lesson::getId, Function.identity()));

        List<AdminDashboardStatsDto.RecentActivityItem> recentList = new ArrayList<>();
        for (LessonCompletion c : completions) {
            AppUser u = userMap.get(c.getUserId());
            Lesson l = lessonMap.get(c.getLessonId());
            recentList.add(new AdminDashboardStatsDto.RecentActivityItem(
                    l != null ? l.getTitle() : "Bài học",
                    u != null ? u.getEmail() : "Học viên",
                    c.getScorePercent(),
                    c.getCreatedAt()
            ));
        }

        return new AdminDashboardStatsDto(
                totalUsers,
                activeToday,
                totalLessonsCompleted,
                totalAiAttempts,
                totalRevenue,
                activeSubs,
                totalQuests,
                ranged ? "DATE_RANGE" : "ALL_TIME",
                BUSINESS_ZONE.getId(),
                rangeFrom,
                rangeToExclusive,
                recentList
        );
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if ((from == null) != (to == null)
                || (from != null && (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS))) {
            throw new vn.duy.signlight.common.error.BusinessException(
                    vn.duy.signlight.common.error.ErrorCode.INVALID_PAYLOAD);
        }
    }
}
