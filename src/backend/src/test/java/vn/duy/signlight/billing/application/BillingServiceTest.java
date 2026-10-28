package vn.duy.signlight.billing.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.billing.domain.GiftCode;
import vn.duy.signlight.billing.domain.PaymentTransaction;
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
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.billing.web.dto.FeedbackRequest;
import vn.duy.signlight.billing.web.dto.FeedbackResult;
import vn.duy.signlight.billing.web.dto.RedeemCodeResult;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;

class BillingServiceTest {

    private PlanRepository planRepository;
    private SubscriptionRepository subscriptionRepository;
    private PaymentTransactionRepository transactionRepository;
    private PaymentWebhookLogRepository webhookLogRepository;
    private PayOsClient payOsClient;
    private AuthService authService;
    private ObjectMapper objectMapper;
    private GiftCodeRepository giftCodeRepository;
    private GiftCodeRedemptionRepository giftCodeRedemptionRepository;
    private UserFeedbackRepository userFeedbackRepository;
    private UserProfileRepository userProfileRepository;
    private NotificationService notificationService;
    private BillingService billingService;

    @BeforeEach
    void setUp() {
        planRepository = mock(PlanRepository.class);
        subscriptionRepository = mock(SubscriptionRepository.class);
        transactionRepository = mock(PaymentTransactionRepository.class);
        webhookLogRepository = mock(PaymentWebhookLogRepository.class);
        payOsClient = mock(PayOsClient.class);
        authService = mock(AuthService.class);
        objectMapper = new ObjectMapper();
        giftCodeRepository = mock(GiftCodeRepository.class);
        giftCodeRedemptionRepository = mock(GiftCodeRedemptionRepository.class);
        userFeedbackRepository = mock(UserFeedbackRepository.class);
        userProfileRepository = mock(UserProfileRepository.class);
        notificationService = mock(NotificationService.class);

        billingService = new BillingService(
                planRepository,
                subscriptionRepository,
                transactionRepository,
                webhookLogRepository,
                payOsClient,
                authService,
                objectMapper,
                giftCodeRepository,
                giftCodeRedemptionRepository,
                userFeedbackRepository,
                userProfileRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("createCheckout tạo transaction và trả về checkoutUrl từ payOS")
    void createCheckoutReturnsPayOsCheckoutUrl() {
        UUID userId = UUID.randomUUID();
        Plan plan = Plan.builder()
                .id("PREMIUM_6M")
                .name("SignLight Premium 6 Thang")
                .priceVnd(100000)
                .durationDays(180)
                .active(true)
                .build();

        when(planRepository.findById("PREMIUM_6M")).thenReturn(Optional.of(plan));
        when(payOsClient.createPaymentLink(any(Long.class), any(Integer.class), any(String.class)))
                .thenReturn(new PayOsClient.PayOsPaymentResult("link-123", "https://pay.payos.vn/web/123", "qr-data-string", "PENDING"));

        CheckoutResult result = billingService.createCheckout(userId, "PREMIUM_6M");

        assertNotNull(result);
        assertEquals("PENDING", result.status());
        assertEquals("https://pay.payos.vn/web/123", result.checkoutUrl());
        assertEquals("qr-data-string", result.qrCode());
        verify(transactionRepository).save(any(PaymentTransaction.class));
    }

    @Test
    @DisplayName("confirmPayment cập nhật CSDL thành PAID, tạo Subscription và nâng quyền ROLE_LEARNER_PREMIUM")
    void confirmPaymentActivatesSubscriptionAndUpgradesRole() {
        UUID userId = UUID.randomUUID();
        long orderCode = 1726912345678L;
        Plan plan = Plan.builder()
                .id("PREMIUM_6M")
                .name("SignLight Premium 6 Thang")
                .priceVnd(100000)
                .durationDays(180)
                .active(true)
                .build();

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_6M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(100000)
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(transactionRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(tx));
        when(planRepository.findById("PREMIUM_6M")).thenReturn(Optional.of(plan));
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "ACTIVE"))
                .thenReturn(Optional.empty());
        when(payOsClient.getPaymentLinkInformation(orderCode)).thenReturn(Optional.of(
                new PayOsClient.PayOsPaymentResult("payos-id-confirm", "https://pay.payos.vn/...", "qr-data", "PAID")));

        CheckoutResult result = billingService.confirmPayment(orderCode, userId);

        assertEquals("PAID", result.status());
        assertEquals("PAID", tx.getStatus());
        assertNotNull(tx.getPaidAt());
        verify(subscriptionRepository).save(any(Subscription.class));
        verify(authService).upgradeToPremium(userId);
    }

    @Test
    @DisplayName("confirmPayment từ chối kích hoạt và ném PAYMENT_NOT_COMPLETED khi payOS vẫn PENDING")
    void confirmPaymentThrowsExceptionWhenPayOsPending() {
        UUID userId = UUID.randomUUID();
        long orderCode = 1726912345678L;

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_6M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(100000)
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(transactionRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(tx));
        when(payOsClient.getPaymentLinkInformation(orderCode)).thenReturn(Optional.of(
                new PayOsClient.PayOsPaymentResult("payos-id-1", "https://pay.payos.vn/...", "qr-data", "PENDING")));

        vn.duy.signlight.common.error.BusinessException ex = assertThrows(
                vn.duy.signlight.common.error.BusinessException.class,
                () -> billingService.confirmPayment(orderCode, userId)
        );
        assertEquals(vn.duy.signlight.common.error.ErrorCode.PAYMENT_NOT_COMPLETED.getCode(), ex.getErrorCode());

        verify(subscriptionRepository, never()).save(any());
        verify(authService, never()).upgradeToPremium(any());
    }

    @Test
    @DisplayName("syncAndGetTransactionStatus chủ động đồng bộ từ payOS API khi chưa có public webhook và kích hoạt Premium")
    void syncAndGetTransactionStatusPullsPayOsApiWhenWebhookUnavailable() {
        UUID userId = UUID.randomUUID();
        long orderCode = 1726912345678L;
        Plan plan = Plan.builder()
                .id("PREMIUM_1M")
                .name("SignLight Premium 1 Thang")
                .priceVnd(29000)
                .durationDays(30)
                .active(true)
                .build();

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_1M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(29000)
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(transactionRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(tx));
        when(planRepository.findById("PREMIUM_1M")).thenReturn(Optional.of(plan));
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "ACTIVE"))
                .thenReturn(Optional.empty());

        // payOS báo PAID qua API
        when(payOsClient.getPaymentLinkInformation(orderCode)).thenReturn(Optional.of(
                new PayOsClient.PayOsPaymentResult("payos-id-1", "https://pay.payos.vn/...", "qr-data", "PAID")));

        PaymentTransaction syncedTx = billingService.syncAndGetTransactionStatus(orderCode, userId);

        assertEquals("PAID", syncedTx.getStatus());
        assertNotNull(syncedTx.getPaidAt());
        verify(subscriptionRepository).save(any(Subscription.class));
        verify(authService).upgradeToPremium(userId);
    }

    @Test
    @DisplayName("confirmPayment không kích hoạt Premium khi số tiền payOS lệch với đơn")
    void confirmPaymentRejectsMismatchedAmount() {
        UUID userId = UUID.randomUUID();
        long orderCode = 1726912345999L;
        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_1M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(29000)
                .status("PENDING")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(transactionRepository.findByOrderCode(orderCode)).thenReturn(Optional.of(tx));
        when(payOsClient.getPaymentLinkInformation(orderCode)).thenReturn(Optional.of(
                new PayOsClient.PayOsPaymentResult(
                        "payos-id", "https://pay.payos.vn/...", "qr-data", "PAID",
                        null, null, null, null, 100)));

        vn.duy.signlight.common.error.BusinessException ex = assertThrows(
                vn.duy.signlight.common.error.BusinessException.class,
                () -> billingService.confirmPayment(orderCode, userId));

        assertEquals(vn.duy.signlight.common.error.ErrorCode.PAYMENT_AMOUNT_MISMATCH.getCode(), ex.getErrorCode());
        verify(subscriptionRepository, never()).save(any());
        verify(authService, never()).upgradeToPremium(any());
    }

    @Test
    @DisplayName("createCheckout với gói tri ân 0đ kích hoạt trực tiếp Subscription không qua payOS")
    void createCheckoutAppreciationPlanActivatesDirectly() {
        UUID userId = UUID.randomUUID();
        Plan plan = Plan.builder()
                .id("PREMIUM_TRIAN_1M")
                .name("SignLight Premium Tri An")
                .priceVnd(0)
                .durationDays(30)
                .active(true)
                .build();

        when(planRepository.findById("PREMIUM_TRIAN_1M")).thenReturn(Optional.of(plan));
        when(subscriptionRepository.existsByUserIdAndPlanId(userId, "PREMIUM_TRIAN_1M")).thenReturn(false);
        when(subscriptionRepository.findFirstByUserIdAndStatusOrderByExpiresAtDesc(userId, "ACTIVE"))
                .thenReturn(Optional.empty());

        CheckoutResult result = billingService.createCheckout(userId, "PREMIUM_TRIAN_1M");

        assertNotNull(result);
        assertEquals("PAID", result.status());
        assertEquals(0, result.amount());
        verify(payOsClient, never()).createPaymentLink(any(Long.class), any(Integer.class), any(String.class));
        verify(subscriptionRepository).save(any(Subscription.class));
        verify(authService).upgradeToPremium(userId);
    }

    @Test
    @DisplayName("createCheckout với gói tri ân 0đ từ chối khi user đã từng nhận")
    void createCheckoutAppreciationPlanRejectsWhenAlreadyClaimed() {
        UUID userId = UUID.randomUUID();
        Plan plan = Plan.builder()
                .id("PREMIUM_TRIAN_1M")
                .name("SignLight Premium Tri An")
                .priceVnd(0)
                .durationDays(30)
                .active(true)
                .build();

        when(planRepository.findById("PREMIUM_TRIAN_1M")).thenReturn(Optional.of(plan));
        when(subscriptionRepository.existsByUserIdAndPlanId(userId, "PREMIUM_TRIAN_1M")).thenReturn(true);

        vn.duy.signlight.common.error.BusinessException ex = assertThrows(
                vn.duy.signlight.common.error.BusinessException.class,
                () -> billingService.createCheckout(userId, "PREMIUM_TRIAN_1M")
        );

        assertEquals(vn.duy.signlight.common.error.ErrorCode.TRIAL_ALREADY_CLAIMED.getCode(), ex.getErrorCode());
        verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("redeemCode cộng quà EXP và AI quota thành công")
    void redeemCodeGrantsRewards() {
        UUID userId = UUID.randomUUID();
        GiftCode code = GiftCode.builder()
                .code("TRIAN2026")
                .title("Quà Tri Ân")
                .description("+10 lượt AI, +150 EXP")
                .aiQuota(10)
                .expReward(150)
                .premiumDays(0)
                .maxUses(-1)
                .usedCount(0)
                .active(true)
                .build();

        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .displayName("Hoc vien")
                .timezone("Asia/Ho_Chi_Minh")
                .aiBonusQuota(2)
                .expBalance(100)
                .build();

        when(giftCodeRepository.findByCodeIgnoreCaseAndActiveTrue("TRIAN2026")).thenReturn(Optional.of(code));
        when(giftCodeRedemptionRepository.existsByUserIdAndCodeIgnoreCase(userId, "TRIAN2026")).thenReturn(false);
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        RedeemCodeResult result = billingService.redeemCode(userId, "trian2026");

        assertNotNull(result);
        assertEquals("TRIAN2026", result.code());
        assertEquals(150, result.expReward());
        assertEquals(10, result.aiQuota());
        assertEquals(12, profile.getAiBonusQuota());
        assertEquals(250, profile.getExpBalance());
        verify(giftCodeRedemptionRepository).save(any());
        verify(userProfileRepository).save(profile);
    }

    @Test
    @DisplayName("redeemCode từ chối khi mã quà tặng đã nhận rồi")
    void redeemCodeRejectsWhenAlreadyRedeemed() {
        UUID userId = UUID.randomUUID();
        GiftCode code = GiftCode.builder()
                .code("TRIAN2026")
                .title("Quà Tri Ân")
                .active(true)
                .build();

        when(giftCodeRepository.findByCodeIgnoreCaseAndActiveTrue("TRIAN2026")).thenReturn(Optional.of(code));
        when(giftCodeRedemptionRepository.existsByUserIdAndCodeIgnoreCase(userId, "TRIAN2026")).thenReturn(true);

        vn.duy.signlight.common.error.BusinessException ex = assertThrows(
                vn.duy.signlight.common.error.BusinessException.class,
                () -> billingService.redeemCode(userId, "TRIAN2026")
        );

        assertEquals(vn.duy.signlight.common.error.ErrorCode.GIFT_CODE_ALREADY_USED.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("submitFeedback lưu feedback thành công")
    void submitFeedbackSavesSuccessfully() {
        UUID userId = UUID.randomUUID();
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(5);
        req.setCategory("AI_CAMERA");
        req.setContent("Tính năng luyện AI nhận diện rất nhạy!");

        FeedbackResult result = billingService.submitFeedback(userId, req);

        assertNotNull(result);
        assertEquals(true, result.success());
        verify(userFeedbackRepository).save(any(UserFeedback.class));
    }
}
