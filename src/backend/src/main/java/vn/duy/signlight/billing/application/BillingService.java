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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.billing.domain.PaymentTransaction;
import vn.duy.signlight.billing.domain.PaymentWebhookLog;
import vn.duy.signlight.billing.domain.Plan;
import vn.duy.signlight.billing.domain.Subscription;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.billing.repository.PaymentWebhookLogRepository;
import vn.duy.signlight.billing.repository.PlanRepository;
import vn.duy.signlight.billing.repository.SubscriptionRepository;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.billing.web.dto.PayOsWebhookPayload;
import vn.duy.signlight.billing.web.dto.PlanDto;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.application.AuthService;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentWebhookLogRepository webhookLogRepository;
    private final PayOsClient payOsClient;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public BillingService(
            PlanRepository planRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentTransactionRepository transactionRepository,
            PaymentWebhookLogRepository webhookLogRepository,
            PayOsClient payOsClient,
            AuthService authService,
            ObjectMapper objectMapper) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.transactionRepository = transactionRepository;
        this.webhookLogRepository = webhookLogRepository;
        this.payOsClient = payOsClient;
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PlanDto> activePlans() {
        return planRepository.findByActiveTrueOrderByPriceVndAsc().stream()
                .map(p -> new PlanDto(p.getId(), p.getName(), p.getDescription(),
                        p.getDurationDays(), p.getPriceVnd(), p.isActive()))
                .toList();
    }

    @Transactional
    public CheckoutResult createCheckout(UUID userId, String planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

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
                log.info("payos_polled_paid_activated orderCode={}", orderCode);
                activateSubscriptionForTransaction(tx, null);
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
                log.info("payos_confirm_verified_paid orderCode={}", orderCode);
                activateSubscriptionForTransaction(tx, null);
                return toCheckoutResult(tx);
            } else if ("CANCELLED".equalsIgnoreCase(payOsResult.status())) {
                tx.setStatus("CANCELLED");
                tx.setUpdatedAt(Instant.now());
                transactionRepository.save(tx);
                throw new BusinessException(ErrorCode.PAYMENT_NOT_COMPLETED);
            }
        }

        // Trường hợp chạy môi trường giả lập (mock config)
        if (payOsClient.isMockConfig()) {
            log.info("payos_mock_confirm_fallback orderCode={}", orderCode);
            activateSubscriptionForTransaction(tx, null);
            return toCheckoutResult(tx);
        }

        // Nếu payOS chưa xác nhận PAID
        throw new BusinessException(ErrorCode.PAYMENT_NOT_COMPLETED);
    }

    public CheckoutResult toCheckoutResult(PaymentTransaction tx) {
        String bin = tx.getBin() != null ? tx.getBin() : "970418";
        String accNum = tx.getAccountNumber() != null ? tx.getAccountNumber() : "V3CAS5111146929";
        String accName = tx.getAccountName() != null ? tx.getAccountName() : "PHAN BUI BA DAT";
        String bankName = tx.getBankName() != null ? tx.getBankName() : VietQrBankHelper.getBankName(bin);
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
        if ("PAID".equals(tx.getStatus())) {
            webhookLog.setProcessed(true);
            webhookLogRepository.save(webhookLog);
            log.info("payos_webhook_already_processed orderCode={}", orderCode);
            return true;
        }

        activateSubscriptionForTransaction(tx, payload.signature());

        webhookLog.setProcessed(true);
        webhookLogRepository.save(webhookLog);

        log.info("payos_webhook_processed_successfully orderCode={} userId={}", orderCode, tx.getUserId());
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<PaymentTransaction> getTransactionStatus(long orderCode) {
        return transactionRepository.findByOrderCode(orderCode);
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

    private Long extractOrderCode(Map<String, Object> data) {
        if (data == null || !data.containsKey("orderCode")) {
            return null;
        }
        Object val = data.get("orderCode");
        if (val instanceof Number num) {
            return num.longValue();
        }
        try {
            return Long.parseLong(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
