package vn.duy.signlight.admin.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.admin.repository.AdminSubscriptionQueryRepository;
import vn.duy.signlight.admin.web.dto.AdminUserDtos;
import vn.duy.signlight.billing.domain.Subscription;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.domain.Streak;
import vn.duy.signlight.gamification.repository.StreakRepository;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.learning.repository.LessonCompletionRepository;
import vn.duy.signlight.notification.application.NotificationService;

@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final AdminSubscriptionQueryRepository subscriptionRepository;
    private final StreakRepository streakRepository;
    private final LessonCompletionRepository completionRepository;
    private final NotificationService notificationService;

    public AdminUserService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            AdminSubscriptionQueryRepository subscriptionRepository,
            StreakRepository streakRepository,
            LessonCompletionRepository completionRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.streakRepository = streakRepository;
        this.completionRepository = completionRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public AdminUserDtos.UserListResult listUsers(String search, String status, String role, int page, int size) {
        int boundedPage = Math.max(0, page);
        Pageable pageable = PageRequest.of(boundedPage, Math.max(1, Math.min(100, size)),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        Page<AppUser> userPage = userRepository.adminSearch(
                normalize(search), upper(status), upper(role), pageable);
        List<AppUser> users = userPage.getContent();
        List<UUID> userIds = users.stream().map(AppUser::getId).toList();
        Map<UUID, UserProfile> profiles = userIds.isEmpty() ? Map.of() : profileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
        Instant now = Instant.now();
        Map<UUID, Subscription> activeSubscriptions = subscriptionRepository.findActiveByUserIds(userIds, now).stream()
                .collect(Collectors.toMap(Subscription::getUserId, Function.identity(), (first, ignored) -> first));

        List<AdminUserDtos.UserSummary> summaries = users.stream().map(user -> {
            UserProfile profile = profiles.get(user.getId());
            Subscription subscription = activeSubscriptions.get(user.getId());
            return new AdminUserDtos.UserSummary(
                    user.getId(), user.getEmail(), profile != null ? profile.getDisplayName() : user.getEmail(),
                    user.getStatus(), user.getRoles(), profile != null ? profile.getExpBalance() : 0,
                    profile != null ? profile.getAiBonusQuota() : 0, subscription != null,
                    subscription != null ? subscription.getPlanId() : "FREE", user.getCreatedAt());
        }).toList();
        return new AdminUserDtos.UserListResult(summaries, userPage.getTotalPages(),
                userPage.getTotalElements(), boundedPage);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String upper(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toUpperCase(java.util.Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public AdminUserDtos.UserDetailResult getUserDetail(UUID userId) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        UserProfile p = profileRepository.findById(userId).orElse(null);

        Optional<Subscription> sub = subscriptionRepository.findActiveByUserIds(List.of(userId), Instant.now())
                .stream().findFirst();
        boolean isPremium = sub.isPresent();

        List<Streak> streaks = streakRepository.findByUserId(userId);
        int currentStreak = streaks.stream().mapToInt(Streak::getCurrentCount).max().orElse(0);
        int longestStreak = streaks.stream().mapToInt(Streak::getLongestCount).max().orElse(0);

        long completedLessons = completionRepository.countByUserId(userId);

        return new AdminUserDtos.UserDetailResult(
                u.getId(),
                u.getEmail(),
                p != null ? p.getDisplayName() : u.getEmail(),
                u.getStatus(),
                u.getRoles(),
                p != null ? p.getExpBalance() : 0,
                p != null ? p.getAiBonusQuota() : 0,
                isPremium,
                isPremium ? sub.get().getPlanId() : "FREE",
                sub.map(Subscription::getExpiresAt).orElse(null),
                currentStreak,
                longestStreak,
                completedLessons,
                u.getCreatedAt(),
                u.getEmailVerifiedAt()
        );
    }

    @Transactional
    public void updateStatus(UUID userId, String newStatus) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        u.setStatus(newStatus.toUpperCase());
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        log.info("admin_updated_user_status user_id={} status={}", userId, newStatus);
    }

    @Transactional
    public void updateRoles(UUID userId, Set<String> roles) {
        AppUser u = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        u.setRoles(roles);
        u.setUpdatedAt(Instant.now());
        userRepository.save(u);
        log.info("admin_updated_user_roles user_id={} roles={}", userId, roles);
    }

    @Transactional
    public void adjustBalance(UUID userId, int expDelta, int aiQuotaDelta, String reason) {
        UserProfile p = profileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (expDelta != 0) {
            p.setExpBalance(Math.max(0, p.getExpBalance() + expDelta));
        }
        if (aiQuotaDelta != 0) {
            p.setAiBonusQuota(Math.max(0, p.getAiBonusQuota() + aiQuotaDelta));
        }
        profileRepository.save(p);

        // Gửi thông báo đến user
        String content = "Quản trị viên đã cập nhật tài khoản của bạn: "
                + (expDelta >= 0 ? "+" : "") + expDelta + " EXP"
                + (aiQuotaDelta != 0 ? ", " + (aiQuotaDelta >= 0 ? "+" : "") + aiQuotaDelta + " lượt AI" : "")
                + (reason != null && !reason.isBlank() ? " (" + reason + ")" : "");

        notificationService.sendNotification(userId, "Điều chỉnh số dư tài khoản", content, "SYSTEM", "/hanh-trinh");
        log.info("admin_adjusted_user_balance user_id={} expDelta={} aiDelta={}", userId, expDelta, aiQuotaDelta);
    }
}
