package vn.duy.signlight.referral.application;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.billing.application.BillingService;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;
import vn.duy.signlight.referral.web.dto.ReferralSummaryResult;

@Service
public class ReferralService {

    private static final Logger log = LoggerFactory.getLogger(ReferralService.class);
    private static final int REFERRAL_TARGET_COUNT = 5;
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final BillingService billingService;
    private final NotificationService notificationService;

    @Value("${signlight.mail.frontend-base-url:https://signlight.id.vn}")
    private String frontendBaseUrl;

    public ReferralService(
            AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            BillingService billingService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.billingService = billingService;
        this.notificationService = notificationService;
    }

    @Transactional
    public ReferralSummaryResult getSummary(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (user.getReferralCode() == null || user.getReferralCode().isBlank()) {
            user.setReferralCode(generateUniqueReferralCode());
            userRepository.save(user);
        }

        List<AppUser> referredUsers = userRepository.findByReferredByUserId(userId);
        long count = referredUsers.size();
        boolean canClaimReward = (count >= REFERRAL_TARGET_COUNT) && !user.isReferralRewardClaimed();

        String referredByCode = null;
        if (user.getReferredByUserId() != null) {
            referredByCode = userRepository.findById(user.getReferredByUserId())
                    .map(AppUser::getReferralCode)
                    .orElse(null);
        }

        List<ReferralSummaryResult.ReferredFriendDto> friends = new ArrayList<>();
        for (AppUser ref : referredUsers) {
            String name = profileRepository.findById(ref.getId())
                    .map(UserProfile::getDisplayName)
                    .orElse("Học viên");
            friends.add(new ReferralSummaryResult.ReferredFriendDto(
                    name,
                    maskEmail(ref.getEmail()),
                    ref.getCreatedAt()
            ));
        }

        String referralLink = frontendBaseUrl.replaceAll("/+$", "") + "/dang-ky?ref=" + user.getReferralCode();

        return new ReferralSummaryResult(
                user.getReferralCode(),
                referralLink,
                count,
                REFERRAL_TARGET_COUNT,
                canClaimReward,
                user.isReferralRewardClaimed(),
                referredByCode,
                friends
        );
    }

    @Transactional
    public ReferralSummaryResult claimCode(UUID userId, String referralCode) {
        String cleanCode = referralCode.trim().toUpperCase();
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (user.getReferredByUserId() != null) {
            throw new BusinessException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        AppUser referrer = userRepository.findByReferralCode(cleanCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (referrer.getId().equals(userId)) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        user.setReferredByUserId(referrer.getId());
        userRepository.save(user);

        log.info("referral_code_claimed userId={} referrerId={} code={}", userId, referrer.getId(), cleanCode);

        // Kiểm tra xem người giới thiệu đã đủ 5 người chưa
        long referrerCount = userRepository.countByReferredByUserId(referrer.getId());
        if (referrerCount >= REFERRAL_TARGET_COUNT && !referrer.isReferralRewardClaimed()) {
            billingService.grantFreePremium(referrer.getId(), 30, "Mời đủ 5 bạn bè tham gia SignLight");
            referrer.setReferralRewardClaimed(true);
            userRepository.save(referrer);

            if (notificationService != null) {
                notificationService.sendNotification(
                        referrer.getId(),
                        "🎉 Nhận thưởng 1 Tháng Premium!",
                        "Chúc mừng bạn đã mời thành công 5 người bạn tham gia SignLight! Gói Premium 1 Tháng miễn phí đã được kích hoạt cho tài khoản của bạn.",
                        "PROMOTION",
                        "/nang-cap"
                );
            }
        }

        if (notificationService != null) {
            notificationService.sendNotification(
                    userId,
                    "Liên kết giới thiệu thành công",
                    "Bạn đã liên kết thành công mã giới thiệu của người bạn " + cleanCode + ". Hãy cùng nhau chinh phục ngôn ngữ ký hiệu nhé!",
                    "SYSTEM",
                    "/gioi-thieu"
            );
        }

        return getSummary(userId);
    }

    @Transactional
    public ReferralSummaryResult claimReward(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        long count = userRepository.countByReferredByUserId(userId);
        if (count < REFERRAL_TARGET_COUNT) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        if (user.isReferralRewardClaimed()) {
            throw new BusinessException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        billingService.grantFreePremium(userId, 30, "Mời đủ 5 người bạn tham gia SignLight");
        user.setReferralRewardClaimed(true);
        userRepository.save(user);

        if (notificationService != null) {
            notificationService.sendNotification(
                    userId,
                    "🎉 Kích hoạt 1 Tháng Premium thành công!",
                    "Gói Premium 1 Tháng miễn phí của bạn đã được kích hoạt thành công. Trải nghiệm ngay các tính năng độc quyền không giới hạn!",
                    "PROMOTION",
                    "/nang-cap"
            );
        }

        log.info("referral_reward_claimed_manually userId={} count={}", userId, count);
        return getSummary(userId);
    }

    private String generateUniqueReferralCode() {
        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder("SL");
            for (int j = 0; j < 6; j++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (userRepository.findByReferralCode(code).isEmpty()) {
                return code;
            }
        }
        return "SL" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String maskEmail(String email) {
        if (email == null) return "";
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) return email;
        String prefix = email.substring(0, 2);
        String domain = email.substring(atIndex);
        return prefix + "***" + domain;
    }
}
