package vn.duy.signlight.billing.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.billing.domain.GiftCode;
import vn.duy.signlight.billing.domain.GiftCodeRedemption;
import vn.duy.signlight.billing.domain.PaymentTransaction;
import vn.duy.signlight.billing.domain.PaymentWebhookLog;
import vn.duy.signlight.billing.domain.Plan;
import vn.duy.signlight.billing.domain.Subscription;
import vn.duy.signlight.billing.domain.UserFeedback;
import vn.duy.signlight.billing.repository.GiftCodeRedemptionRepository;
import vn.duy.signlight.billing.repository.GiftCodeRepository;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.repository.PaymentWebhookLogRepository;
import vn.duy.signlight.billing.repository.PlanRepository;
import vn.duy.signlight.billing.repository.SubscriptionRepository;
import vn.duy.signlight.billing.repository.UserFeedbackRepository;
import vn.duy.signlight.billing.web.dto.AppreciationStatusResult;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.billing.web.dto.FeedbackRequest;
import vn.duy.signlight.billing.web.dto.FeedbackResult;
import vn.duy.signlight.billing.web.dto.PayOsWebhookPayload;
import vn.duy.signlight.billing.web.dto.PlanDto;
import vn.duy.signlight.billing.web.dto.RedeemCodeResult;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;
import vn.duy.signlight.referral.application.ReferralService;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    public static final String APPRECIATION_PLAN_ID = "PREMIUM_TRIAN_1M";

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentWebhookLogRepository webhookLogRepository;
    private final PayOsClient payOsClient;
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final GiftCodeRepository giftCodeRepository;
    private final GiftCodeRedemptionRepository giftCodeRedemptionRepository;
    private final UserFeedbackRepository userFeedbackRepository;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;
    private vn.duy.signlight.learning.application.LessonUnlockService lessonUnlockService;
    private ReferralService referralService;

    public BillingService(
            PlanRepository planRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentTransactionRepository transactionRepository,
            PaymentWebhookLogRepository webhookLogRepository,
            PayOsClient payOsClient,
            AuthService authService,
            ObjectMapper objectMapper) {
        this(planRepository, subscriptionRepository, transactionRepository, webhookLogRepository,
                payOsClient, authService, objectMapper, null, null, null, null, null);
    }

    @Autowired
    public BillingService(
            PlanRepository planRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentTransactionRepository transactionRepository,
            PaymentWebhookLogRepository webhookLogRepository,
            PayOsClient payOsClient,
            AuthService authService,
            ObjectMapper objectMapper,
            @Autowired(required = false) GiftCodeRepository giftCodeRepository,
            @Autowired(required = false) GiftCodeRedemptionRepository giftCodeRedemptionRepository,
            @Autowired(required = false) UserFeedbackRepository userFeedbackRepository,
            @Autowired(required = false) UserProfileRepository userProfileRepository,
            @Autowired(required = false) NotificationService notificationService) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.transactionRepository = transactionRepository;
        this.webhookLogRepository = webhookLogRepository;
        this.payOsClient = payOsClient;
        this.authService = authService;
        this.objectMapper = objectMapper;
        this.giftCodeRepository = giftCodeRepository;
        this.giftCodeRedemptionRepository = giftCodeRedemptionRepository;
        this.userFeedbackRepository = userFeedbackRepository;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
    }

    @Autowired
    public void setLessonUnlockService(@Autowired(required = false) vn.duy.signlight.learning.application.LessonUnlockService lessonUnlockService) {
        this.lessonUnlockService = lessonUnlockService;
    }

    @Autowired
    public void setReferralService(@Lazy @Autowired(required = false) ReferralService referralService) {
        this.referralService = referralService;
    }

    @Transactional(readOnly = true)
    public List<PlanDto> activePlans() {
        return planRepository.findByActiveTrueAndIdStartingWithOrderByPriceVndAsc("PREMIUM_").stream()
                .map(p -> new PlanDto(p.getId(), p.getName(), p.getDescription(),
                        p.getDurationDays(), p.getPriceVnd(), p.isActive()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean hasClaimedAppreciationPlan(UUID userId) {
        if (userId == null) return false;
        return subscriptionRepository.existsByUserIdAndPlanId(userId, APPRECIATION_PLAN_ID);
    }

    @Transactional
    public CheckoutResult createCheckout(UUID userId, String planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!plan.isActive() || !plan.getId().startsWith("PREMIUM_")) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        // Xử lý riêng cho gói tri ân 0đ: không cần gọi payOS và kích hoạt trực tiếp
        if (plan.getPriceVnd() == 0) {
            boolean alreadyClaimed = subscriptionRepository.existsByUserIdAndPlanId(userId, plan.getId());
            if (alreadyClaimed) {
                throw new BusinessException(ErrorCode.TRIAL_ALREADY_CLAIMED);
            }

            long timestampSeconds = Instant.now().getEpochSecond();
            long randomSuffix = ThreadLocalRandom.current().nextLong(100, 999);
            long orderCode = timestampSeconds * 1000 + randomSuffix;
            String orderRef = "SL-FREE-" + orderCode;

            Instant now = Instant.now();
            PaymentTransaction transaction = PaymentTransaction.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .planId(plan.getId())
                    .orderCode(orderCode)
                    .orderRef(orderRef)
                    .provider("INTERNAL")
                    .amount(0)
                    .status("PAID")
                    .paidAt(now)
                    .description("Gói tri ân: " + plan.getName())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            transactionRepository.save(transaction);

            activateSubscriptionForTransaction(transaction, "FREE_GIFT");

            if (notificationService != null) {
                notificationService.sendNotification(
                        userId,
                        "🎉 Kích hoạt gói Tri Ân 1 Tháng thành công!",
                        "Chúc mừng bạn đã nhận 1 tháng trải nghiệm Premium hoàn toàn miễn phí (0đ). Hãy thỏa sức luyện Camera AI và gửi feedback đóng góp ý kiến cho SignLight nhé!",
                        "PROMOTION",
                        "/nang-cap"
                );
            }

            log.info("appreciation_plan_claimed userId={} orderCode={} planId={}", userId, orderCode, plan.getId());

            return new CheckoutResult(
                    orderCode,
                    orderRef,
                    0,
                    null,
                    null,
                    "PAID",
                    null,
                    null,
                    null,
                    null,
                    "Kích hoạt thành công gói tri ân 1 tháng"
            );
        }

        // orderCode payOS: số nguyên dương duy nhất
        long timestampSeconds = Instant.now().getEpochSecond();
        long randomSuffix = ThreadLocalRandom.current().nextLong(100, 999);
        long orderCode = timestampSeconds * 1000 + randomSuffix;
        String orderRef = "SL-" + orderCode;

        PayOsClient.PayOsPaymentResult payResult = payOsClient.createPaymentLink(
                orderCode, plan.getPriceVnd(), "SignLight " + plan.getName());

        String bankName = VietQrBankHelper.getBankName(payResult.bin());

        Instant now = Instant.now();
        PaymentTransaction transaction = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId(plan.getId())
                .orderCode(orderCode)
                .orderRef(orderRef)
                .provider("PAYOS")
                .amount(plan.getPriceVnd())
                .status("PENDING")
                .paymentLinkId(payResult.paymentLinkId())
                .checkoutUrl(payResult.checkoutUrl())
                .qrCode(payResult.qrCode())
                .accountNumber(payResult.accountNumber())
                .accountName(payResult.accountName())
                .bin(payResult.bin())
                .bankName(bankName)
                .description(payResult.description())
                .createdAt(now)
                .updatedAt(now)
                .build();
        transactionRepository.save(transaction);

        log.info("checkout_link_created userId={} orderCode={} planId={}", userId, orderCode, plan.getId());

        return new CheckoutResult(
                orderCode,
                orderRef,
                plan.getPriceVnd(),
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
    public PaymentTransaction syncAndGetTransactionStatus(long orderCode, UUID userId) {
        PaymentTransaction tx = transactionRepository.findByOrderCode(orderCode)
                .filter(t -> userId == null || t.getUserId().equals(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if ("PAID".equals(tx.getStatus())) {
            return tx;
        }

        // Khi webhook chưa tới được (vd chạy localhost chưa có public URL), chủ động kiểm tra payOS API
        payOsClient.getPaymentLinkInformation(orderCode).ifPresent(payOsResult -> {
            if ("PAID".equalsIgnoreCase(payOsResult.status())) {
                requireMatchingAmount(tx, payOsResult.amount());
                log.info("payos_polled_paid_activated orderCode={}", orderCode);
                activateEntitlementForTransaction(tx, null);
            }
        });

        return tx;
    }

    @Transactional
    public CheckoutResult confirmPayment(long orderCode, UUID userId) {
        PaymentTransaction tx = transactionRepository.findByOrderCode(orderCode)
                .filter(t -> userId == null || t.getUserId().equals(userId))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if ("PAID".equals(tx.getStatus())) {
            return toCheckoutResult(tx);
        }

        // Kiểm tra và xác thực lại trạng thái thực tế từ cổng payOS
        Optional<PayOsClient.PayOsPaymentResult> payOsOpt = payOsClient.getPaymentLinkInformation(orderCode);
        if (payOsOpt.isPresent()) {
            PayOsClient.PayOsPaymentResult payOsResult = payOsOpt.get();
            if ("PAID".equalsIgnoreCase(payOsResult.status())) {
                requireMatchingAmount(tx, payOsResult.amount());
                log.info("payos_confirm_verified_paid orderCode={}", orderCode);
                activateEntitlementForTransaction(tx, null);
                return toCheckoutResult(tx);
            } else if ("CANCELLED".equalsIgnoreCase(payOsResult.status())) {
                tx.setStatus("CANCELLED");
                tx.setUpdatedAt(Instant.now());
                transactionRepository.save(tx);
                throw new BusinessException(ErrorCode.PAYMENT_NOT_COMPLETED);
            }
        }

        // Nếu payOS chưa xác nhận PAID
        throw new BusinessException(ErrorCode.PAYMENT_NOT_COMPLETED);
    }

    public CheckoutResult toCheckoutResult(PaymentTransaction tx) {
        String bin = tx.getBin();
        String accNum = tx.getAccountNumber();
        String accName = tx.getAccountName();
        String bankName = tx.getBankName();
        String desc = tx.getDescription() != null ? tx.getDescription() : tx.getOrderRef();

        return new CheckoutResult(
                tx.getOrderCode(),
                tx.getOrderRef(),
                tx.getAmount(),
                tx.getCheckoutUrl(),
                tx.getQrCode(),
                tx.getStatus(),
                accNum,
                accName,
                bin,
                bankName,
                desc
        );
    }

    @Transactional
    public boolean handlePayOsWebhook(PayOsWebhookPayload payload, String rawPayload) {
        Map<String, Object> data = payload.data();
        Long orderCode = extractOrderCode(data);

        boolean isValid = payOsClient.verifyWebhookSignature(data, payload.signature());

        PaymentWebhookLog webhookLog = PaymentWebhookLog.builder()
                .id(UUID.randomUUID())
                .provider("PAYOS")
                .orderCode(orderCode)
                .rawPayload(rawPayload)
                .signature(payload.signature())
                .valid(isValid)
                .processed(false)
                .build();

        if (!isValid) {
            webhookLog.setErrorMessage("Chữ ký HMAC không hợp lệ");
            webhookLogRepository.save(webhookLog);
            log.warn("payos_webhook_rejected_invalid_signature orderCode={}", orderCode);
            return false;
        }

        // Request test / xác nhận webhook từ payOS Dashboard (có thể data null hoặc orderCode test)
        if (orderCode == null) {
            webhookLog.setErrorMessage("Webhook test hoặc không có orderCode");
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            log.info("payos_webhook_test_verification_success");
            return true;
        }

        Optional<PaymentTransaction> optTx = transactionRepository.findByOrderCode(orderCode);
        if (optTx.isEmpty()) {
            webhookLog.setErrorMessage("Không tìm thấy giao dịch với orderCode=" + orderCode + " (có thể là test webhook)");
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            log.info("payos_webhook_test_or_unmatched orderCode={}", orderCode);
            return true;
        }

        PaymentTransaction tx = optTx.get();
        if (!"00".equals(payload.code())) {
            webhookLog.setErrorMessage("Webhook không xác nhận thanh toán thành công");
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            return false;
        }
        if ("PAID".equals(tx.getStatus())) {
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            log.info("payos_webhook_already_processed orderCode={}", orderCode);
            return true;
        }

        Long paidAmount = extractLong(data, "amount");
        if (paidAmount == null || paidAmount != tx.getAmount()) {
            webhookLog.setErrorMessage("Số tiền webhook không khớp giao dịch");
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            log.warn("payos_webhook_amount_mismatch orderCode={} expected={} actual={}",
                    orderCode, tx.getAmount(), paidAmount);
            return false;
        }

        activateEntitlementForTransaction(tx, payload.signature());

        webhookLog.setProcessed(true);
        webhookLogRepository.save(webhookLog);

        log.info("payos_webhook_processed_successfully orderCode={} userId={}", orderCode, tx.getUserId());
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<PaymentTransaction> getTransactionStatus(long orderCode) {
        return transactionRepository.findByOrderCode(orderCode);
    }

    /** Phân luồng entitlement ở server; giao dịch bài học cũ tuyệt đối không được nâng Premium. */
    private void activateEntitlementForTransaction(PaymentTransaction tx, String webhookSignature) {
        if (tx.getPlanId() != null && tx.getPlanId().startsWith("LESSON_")) {
            activateLessonUnlockForTransaction(tx, webhookSignature);
            return;
        }
        if (tx.getPlanId() == null || !tx.getPlanId().startsWith("PREMIUM_")) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        activateSubscriptionForTransaction(tx, webhookSignature);
    }

    private void activateLessonUnlockForTransaction(PaymentTransaction tx, String webhookSignature) {
        Instant now = Instant.now();
        tx.setStatus("PAID");
        tx.setPaidAt(now);
        if (webhookSignature != null) {
            tx.setWebhookSignature(webhookSignature);
        }
        tx.setUpdatedAt(now);
        transactionRepository.save(tx);

        try {
            String desc = tx.getDescription();
            if (desc != null && desc.contains(":")) {
                String[] parts = desc.split(":");
                UUID lessonId = UUID.fromString(parts[0]);
                String unlockType = parts[1];
                if (lessonUnlockService != null) {
                    lessonUnlockService.recordPaidUnlock(tx.getUserId(), lessonId, unlockType, tx.getAmount(), "VND");
                }
            }
        } catch (Exception e) {
            log.error("failed_to_activate_lesson_unlock orderCode={}", tx.getOrderCode(), e);
        }
    }

    private void activateSubscriptionForTransaction(PaymentTransaction tx, String webhookSignature) {
        Instant now = Instant.now();
        tx.setStatus("PAID");
        tx.setPaidAt(now);
        if (webhookSignature != null) {
            tx.setWebhookSignature(webhookSignature);
        }
        tx.setUpdatedAt(now);
        transactionRepository.save(tx);

        Plan plan = planRepository.findById(tx.getPlanId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        Optional<Subscription> activeSub = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByExpiresAtDesc(tx.getUserId(), "ACTIVE");

        Instant baseTime = now;
        if (activeSub.isPresent() && activeSub.get().getExpiresAt().isAfter(now)) {
            baseTime = activeSub.get().getExpiresAt();
        }
        Instant newExpiresAt = baseTime.plus(Duration.ofDays(plan.getDurationDays()));

        Subscription subscription = Subscription.builder()
                .id(UUID.randomUUID())
                .userId(tx.getUserId())
                .planId(plan.getId())
                .status("ACTIVE")
                .activatedAt(now)
                .expiresAt(newExpiresAt)
                .createdAt(now)
                .updatedAt(now)
                .build();
        subscriptionRepository.save(subscription);

        authService.upgradeToPremium(tx.getUserId());

        log.info("subscription_activated_and_role_upgraded userId={} orderCode={} planId={} expiresAt={}",
                tx.getUserId(), tx.getOrderCode(), plan.getId(), newExpiresAt);
    }

    @Transactional
    public void grantFreePremium(UUID userId, int durationDays, String reason) {
        Instant now = Instant.now();
        Optional<Subscription> activeSub = subscriptionRepository
                .findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "ACTIVE");

        Instant baseTime = now;
        if (activeSub.isPresent() && activeSub.get().getExpiresAt().isAfter(now)) {
            baseTime = activeSub.get().getExpiresAt();
        }
        Instant newExpiresAt = baseTime.plus(Duration.ofDays(durationDays));

        Subscription subscription = Subscription.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_1M")
                .status("ACTIVE")
                .activatedAt(now)
                .expiresAt(newExpiresAt)
                .createdAt(now)
                .updatedAt(now)
                .build();
        subscriptionRepository.save(subscription);

        authService.upgradeToPremium(userId);

        log.info("free_premium_granted userId={} days={} expiresAt={} reason={}",
                userId, durationDays, newExpiresAt, reason);
    }

    private Long extractOrderCode(Map<String, Object> data) {
        return extractLong(data, "orderCode");
    }

    private Long extractLong(Map<String, Object> data, String key) {
        if (data == null || !data.containsKey(key)) {
            return null;
        }
        Object val = data.get(key);
        if (val instanceof Number num) {
            return num.longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional
    public RedeemCodeResult redeemCode(UUID userId, String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }
        String cleanCode = rawCode.trim().toUpperCase();

        // 1. Kiểm tra mã quà tặng trong bảng gift_code
        if (giftCodeRepository != null) {
            Optional<GiftCode> giftOpt = giftCodeRepository.findByCodeIgnoreCaseAndActiveTrue(cleanCode);
            if (giftOpt.isPresent()) {
                GiftCode gift = giftOpt.get();

                // Kiểm tra hạn sử dụng nếu có
                if (gift.getExpiresAt() != null && gift.getExpiresAt().isBefore(Instant.now())) {
                    throw new BusinessException(ErrorCode.GIFT_CODE_EXPIRED);
                }

                // Kiểm tra giới hạn số lượt kích hoạt
                if (gift.getMaxUses() > 0 && gift.getUsedCount() >= gift.getMaxUses()) {
                    throw new BusinessException(ErrorCode.GIFT_CODE_EXPIRED);
                }

                // Kiểm tra người dùng đã nhận mã này chưa
                if (giftCodeRedemptionRepository != null
                        && giftCodeRedemptionRepository.existsByUserIdAndCodeIgnoreCase(userId, cleanCode)) {
                    throw new BusinessException(ErrorCode.GIFT_CODE_ALREADY_USED);
                }

                // Cộng quà tặng EXP và Lượt Camera AI
                if (userProfileRepository != null) {
                    UserProfile profile = userProfileRepository.findById(userId).orElse(null);
                    if (profile != null) {
                        if (gift.getAiQuota() > 0) {
                            profile.setAiBonusQuota(profile.getAiBonusQuota() + gift.getAiQuota());
                        }
                        if (gift.getExpReward() > 0) {
                            profile.setExpBalance(profile.getExpBalance() + gift.getExpReward());
                        }
                        userProfileRepository.save(profile);
                    }
                }

                // Cộng ngày Premium nếu có
                if (gift.getPremiumDays() > 0) {
                    grantFreePremium(userId, gift.getPremiumDays(), "Mã quà tặng: " + cleanCode);
                }

                // Ghi nhận lịch sử nhận quà
                if (giftCodeRedemptionRepository != null) {
                    GiftCodeRedemption redemption = GiftCodeRedemption.builder()
                            .id(UUID.randomUUID())
                            .userId(userId)
                            .code(cleanCode)
                            .redeemedAt(Instant.now())
                            .build();
                    giftCodeRedemptionRepository.save(redemption);
                }

                gift.setUsedCount(gift.getUsedCount() + 1);
                giftCodeRepository.save(gift);

                if (notificationService != null) {
                    notificationService.sendNotification(
                            userId,
                            "🎁 Nhận quà thành công!",
                            "Bạn đã kích hoạt thành công mã " + cleanCode + " và nhận quà tặng đặc biệt từ SignLight.",
                            "PROMOTION",
                            "/nang-cap"
                    );
                }

                log.info("gift_code_redeemed userId={} code={}", userId, cleanCode);
                return new RedeemCodeResult(
                        cleanCode,
                        gift.getTitle(),
                        gift.getDescription(),
                        gift.getExpReward(),
                        gift.getAiQuota(),
                        gift.getPremiumDays(),
                        "Chúc mừng bạn đã nhận thành công quà tặng từ mã " + cleanCode + "!"
                );
            }
        }

        // 2. Nếu không phải gift_code, kiểm tra xem có phải mã giới thiệu (referral code) của bạn bè
        if (referralService != null) {
            try {
                referralService.claimCode(userId, cleanCode);
                return new RedeemCodeResult(
                        cleanCode,
                        "Mã giới thiệu bạn bè",
                        "Liên kết thành công mã giới thiệu của bạn bè. Tiếp tục cùng nhau học và rèn luyện nhé!",
                        0,
                        0,
                        0,
                        "Đã liên kết mã giới thiệu thành công!"
                );
            } catch (BusinessException be) {
                if (ErrorCode.ITEM_ALREADY_OWNED.getCode().equals(be.getErrorCode())) {
                    throw new BusinessException(ErrorCode.GIFT_CODE_ALREADY_USED);
                }
                throw new BusinessException(ErrorCode.GIFT_CODE_INVALID);
            }
        }

        throw new BusinessException(ErrorCode.GIFT_CODE_INVALID);
    }

    @Transactional
    public FeedbackResult submitFeedback(UUID userId, FeedbackRequest request) {
        if (request.getContent() == null || request.getContent().trim().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        if (userFeedbackRepository != null) {
            UserFeedback feedback = UserFeedback.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .rating(Math.max(1, Math.min(5, request.getRating())))
                    .category(request.getCategory() != null ? request.getCategory() : "GENERAL")
                    .content(request.getContent().trim())
                    .createdAt(Instant.now())
                    .build();
            userFeedbackRepository.save(feedback);
        }

        log.info("user_feedback_submitted userId={} rating={} category={}",
                userId, request.getRating(), request.getCategory());

        if (notificationService != null && userId != null) {
            notificationService.sendNotification(
                    userId,
                    "💌 Cảm ơn bạn đã đóng góp ý kiến!",
                    "SignLight đã ghi nhận feedback của bạn. Đội ngũ phát triển luôn trân trọng mọi ý kiến để hoàn thiện ứng dụng tốt hơn mỗi ngày.",
                    "SYSTEM",
                    "/nang-cap"
            );
        }

        return new FeedbackResult(true, "Cảm ơn bạn đã đóng góp ý kiến quý báu cho SignLight!");
    }

    private void requireMatchingAmount(PaymentTransaction tx, Integer paidAmount) {
        if (paidAmount != null && paidAmount != tx.getAmount()) {
            log.warn("payos_payment_amount_mismatch orderCode={} expected={} actual={}",
                    tx.getOrderCode(), tx.getAmount(), paidAmount);
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }
    }
}
