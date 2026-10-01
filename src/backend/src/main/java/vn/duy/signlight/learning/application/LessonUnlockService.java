package vn.duy.signlight.learning.application;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.billing.application.PayOsClient;
import vn.duy.signlight.billing.application.VietQrBankHelper;
import vn.duy.signlight.billing.domain.PaymentTransaction;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.learning.domain.UserUnlockedLesson;
import vn.duy.signlight.learning.repository.UserUnlockedLessonRepository;
import vn.duy.signlight.learning.web.dto.LessonUnlockResult;
import vn.duy.signlight.notification.application.NotificationService;

@Service
public class LessonUnlockService {

    private static final Logger log = LoggerFactory.getLogger(LessonUnlockService.class);

    public static final int COST_RENT_1M = 5000;
    public static final int COST_PERMANENT = 25000;

    private final UserUnlockedLessonRepository unlockedLessonRepository;
    private final UserProfileRepository userProfileRepository;
    private final LessonRepository lessonRepository;
    private final PayOsClient payOsClient;
    private final PaymentTransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public LessonUnlockService(
            UserUnlockedLessonRepository unlockedLessonRepository,
            UserProfileRepository userProfileRepository,
            LessonRepository lessonRepository,
            PayOsClient payOsClient,
            PaymentTransactionRepository transactionRepository,
            NotificationService notificationService) {
        this.unlockedLessonRepository = unlockedLessonRepository;
        this.userProfileRepository = userProfileRepository;
        this.lessonRepository = lessonRepository;
        this.payOsClient = payOsClient;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public LessonUnlockResult unlockWithExp(UUID userId, UUID lessonId, String unlockType) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        int requiredCost = UserUnlockedLesson.TYPE_PERMANENT.equalsIgnoreCase(unlockType)
                ? COST_PERMANENT
                : COST_RENT_1M;
        String normalizedType = UserUnlockedLesson.TYPE_PERMANENT.equalsIgnoreCase(unlockType)
                ? UserUnlockedLesson.TYPE_PERMANENT
                : UserUnlockedLesson.TYPE_RENT_1M;

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (profile.getExpBalance() < requiredCost) {
            throw new BusinessException(ErrorCode.EXP_INSUFFICIENT);
        }

        profile.setExpBalance(profile.getExpBalance() - requiredCost);
        userProfileRepository.save(profile);

        UserUnlockedLesson unlock = saveOrUpdateUnlock(userId, lessonId, normalizedType, "EXP", requiredCost);

        if (notificationService != null) {
            String title = "Mở khóa bài học thành công!";
            String desc = "Bạn đã dùng " + requiredCost + " EXP để mở khóa '" + lesson.getTitle() + "' "
                    + (unlock.getExpiresAt() == null ? "vĩnh viễn." : "trong 30 ngày.");
            notificationService.sendNotification(userId, title, desc, "LEARNING", "/hoc/bai-moi/" + lessonId);
        }

        log.info("lesson_unlocked_with_exp userId={} lessonId={} type={} cost={}",
                userId, lessonId, normalizedType, requiredCost);

        return new LessonUnlockResult(
                lessonId,
                normalizedType,
                "EXP",
                requiredCost,
                unlock.getExpiresAt(),
                unlock.getExpiresAt() == null,
                profile.getExpBalance()
        );
    }

    @Transactional
    public CheckoutResult createPayOsCheckout(UUID userId, UUID lessonId, String unlockType) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        int amount = UserUnlockedLesson.TYPE_PERMANENT.equalsIgnoreCase(unlockType)
                ? COST_PERMANENT
                : COST_RENT_1M;
        String normalizedType = UserUnlockedLesson.TYPE_PERMANENT.equalsIgnoreCase(unlockType)
                ? UserUnlockedLesson.TYPE_PERMANENT
                : UserUnlockedLesson.TYPE_RENT_1M;

        String planId = UserUnlockedLesson.TYPE_PERMANENT.equals(normalizedType)
                ? "LESSON_PERMANENT"
                : "LESSON_RENT_1M";

        long timestampSeconds = Instant.now().getEpochSecond();
        long randomSuffix = ThreadLocalRandom.current().nextLong(100, 999);
        long orderCode = timestampSeconds * 1000 + randomSuffix;
        String orderRef = "SL-L-" + orderCode;

        String description = "Mo khoa: " + lesson.getTitle();
        if (description.length() > 25) {
            description = description.substring(0, 25);
        }

        PayOsClient.PayOsPaymentResult payResult = payOsClient.createPaymentLink(
                orderCode, amount, description);

        String bankName = VietQrBankHelper.getBankName(payResult.bin());
        Instant now = Instant.now();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId(planId)
                .orderCode(orderCode)
                .orderRef(orderRef)
                .provider("PAYOS")
                .amount(amount)
                .status("PENDING")
                .paymentLinkId(payResult.paymentLinkId())
                .checkoutUrl(payResult.checkoutUrl())
                .qrCode(payResult.qrCode())
                .accountNumber(payResult.accountNumber())
                .accountName(payResult.accountName())
                .bin(payResult.bin())
                .bankName(bankName)
                .description(lessonId.toString() + ":" + normalizedType)
                .createdAt(now)
                .updatedAt(now)
                .build();
        transactionRepository.save(transaction);

        log.info("lesson_checkout_created userId={} lessonId={} orderCode={} type={} amount={}",
                userId, lessonId, orderCode, normalizedType, amount);

        return new CheckoutResult(
                orderCode,
                orderRef,
                amount,
                payResult.checkoutUrl(),
                payResult.qrCode(),
                "PENDING",
                payResult.accountNumber(),
                payResult.accountName(),
                payResult.bin(),
                bankName,
                payResult.description()
        );
    }

    @Transactional
    public UserUnlockedLesson recordPaidUnlock(UUID userId, UUID lessonId, String unlockType, int amount, String paidBy) {
        return saveOrUpdateUnlock(userId, lessonId, unlockType, paidBy, amount);
    }

    private UserUnlockedLesson saveOrUpdateUnlock(UUID userId, UUID lessonId, String unlockType, String paidBy, int amount) {
        Instant now = Instant.now();
        Instant expiresAt = UserUnlockedLesson.TYPE_PERMANENT.equals(unlockType)
                ? null
                : now.plus(Duration.ofDays(30));

        Optional<UserUnlockedLesson> optExisting = unlockedLessonRepository.findByUserIdAndLessonId(userId, lessonId);
        UserUnlockedLesson entity;
        if (optExisting.isPresent()) {
            entity = optExisting.get();
            // Nếu đã mua vĩnh viễn thì giữ nguyên vĩnh viễn
            if (!UserUnlockedLesson.TYPE_PERMANENT.equals(entity.getUnlockType())) {
                entity.setUnlockType(unlockType);
                if (UserUnlockedLesson.TYPE_PERMANENT.equals(unlockType)) {
                    entity.setExpiresAt(null);
                } else {
                    Instant base = (entity.getExpiresAt() != null && entity.getExpiresAt().isAfter(now))
                            ? entity.getExpiresAt()
                            : now;
                    entity.setExpiresAt(base.plus(Duration.ofDays(30)));
                }
            }
            entity.setPaidBy(paidBy);
            entity.setAmount(amount);
        } else {
            entity = UserUnlockedLesson.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .lessonId(lessonId)
                    .unlockType(unlockType)
                    .paidBy(paidBy)
                    .amount(amount)
                    .expiresAt(expiresAt)
                    .createdAt(now)
                    .build();
        }
        return unlockedLessonRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public Optional<UserUnlockedLesson> getActiveUnlock(UUID userId, UUID lessonId) {
        return unlockedLessonRepository.findActiveUnlock(userId, lessonId, Instant.now());
    }
}
