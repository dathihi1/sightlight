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
import vn.duy.signlight.billing.domain.PaymentTransaction;
import vn.duy.signlight.billing.domain.Plan;
import vn.duy.signlight.billing.domain.Subscription;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.repository.PaymentWebhookLogRepository;
import vn.duy.signlight.billing.repository.PlanRepository;
import vn.duy.signlight.billing.repository.SubscriptionRepository;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.identity.application.AuthService;

class BillingServiceTest {

    private PlanRepository planRepository;
    private SubscriptionRepository subscriptionRepository;
    private PaymentTransactionRepository transactionRepository;
    private PaymentWebhookLogRepository webhookLogRepository;
    private PayOsClient payOsClient;
    private AuthService authService;
    private ObjectMapper objectMapper;
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

        billingService = new BillingService(
                planRepository,
                subscriptionRepository,
                transactionRepository,
                webhookLogRepository,
                payOsClient,
                authService,
                objectMapper
        );
    }

    @Test
    @DisplayName("createCheckout tạo transaction và trả về checkoutUrl từ payOS")
    void createCheckoutReturnsPayOsCheckoutUrl() {
        UUID userId = UUID.randomUUID();
        Plan plan = Plan.builder()
                .id("PREMIUM_6M")
                .name("SignLight Premium 6 Thang")
                .priceVnd(499000)
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
                .priceVnd(499000)
                .durationDays(180)
                .active(true)
                .build();

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_6M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(499000)
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
                .amount(499000)
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
                .priceVnd(99000)
                .durationDays(30)
                .active(true)
                .build();

        PaymentTransaction tx = PaymentTransaction.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .planId("PREMIUM_1M")
                .orderCode(orderCode)
                .orderRef("SL-" + orderCode)
                .amount(99000)
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
}
