package vn.duy.signlight.admin.application;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
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

    private final AppUserRepository userRepository;
    private final LessonCompletionRepository completionRepository;
    private final SignAttemptRepository attemptRepository;
    private final PaymentTransactionRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final QuestRepository questRepository;
    private final DailyActivityRepository activityRepository;
    private final LessonRepository lessonRepository;

    public AdminDashboardService(
            AppUserRepository userRepository,
            LessonCompletionRepository completionRepository,
            SignAttemptRepository attemptRepository,
            PaymentTransactionRepository paymentRepository,
            SubscriptionRepository subscriptionRepository,
            QuestRepository questRepository,
            DailyActivityRepository activityRepository,
            LessonRepository lessonRepository) {
        this.userRepository = userRepository;
        this.completionRepository = completionRepository;
        this.attemptRepository = attemptRepository;
        this.paymentRepository = paymentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.questRepository = questRepository;
        this.activityRepository = activityRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getStats() {
        long totalUsers = userRepository.count();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        long activeToday = activityRepository.countDistinctActiveUsersByDate(today);

        long totalLessonsCompleted = completionRepository.count();
        long totalAiAttempts = attemptRepository.count();
        long totalRevenue = paymentRepository.sumSuccessfulAmount();
        long activeSubs = subscriptionRepository.count();
        long totalQuests = questRepository.count();

        // Recent 10 completions
        var page = completionRepository.findAll(PageRequest.of(0, 10, Sort.by("createdAt").descending()));
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
                recentList
        );
    }
}
