package vn.duy.signlight.billing.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.billing.application.BillingService;
import vn.duy.signlight.billing.domain.PaymentTransaction;
import vn.duy.signlight.billing.web.dto.AppreciationStatusResult;
import vn.duy.signlight.billing.web.dto.CheckoutRequest;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.billing.web.dto.FeedbackRequest;
import vn.duy.signlight.billing.web.dto.FeedbackResult;
import vn.duy.signlight.billing.web.dto.PlanDto;
import vn.duy.signlight.billing.web.dto.RedeemCodeRequest;
import vn.duy.signlight.billing.web.dto.RedeemCodeResult;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.identity.application.AuthService;

@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "billing")
public class BillingController {

    private final BillingService billingService;
    private final AuthService authService;

    public BillingController(BillingService billingService, AuthService authService) {
        this.billingService = billingService;
        this.authService = authService;
    }

    @GetMapping("/plans")
    @Operation(summary = "Danh sách các gói dịch vụ Premium đang mở")
    public ResponseEntity<TransactionResponse<List<PlanDto>>> plans(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<PlanDto> result = billingService.activePlans();
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/appreciation-status")
    @Operation(summary = "Kiểm tra xem người dùng đã nhận gói tri ân 0đ 1 tháng hay chưa")
    public ResponseEntity<TransactionResponse<AppreciationStatusResult>> appreciationStatus(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        UUID userId = CurrentUser.findId().orElse(null);
        boolean claimed = userId != null && billingService.hasClaimedAppreciationPlan(userId);
        boolean isPremium = userId != null && authService.isPremium(userId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, new AppreciationStatusResult(
                claimed,
                BillingService.APPRECIATION_PLAN_ID,
                isPremium
        )));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Tạo liên kết thanh toán payOS hoặc kích hoạt trực tiếp gói tri ân 0đ")
    public ResponseEntity<TransactionResponse<CheckoutResult>> checkout(
            @Valid @RequestBody CheckoutRequest request) {
        UUID userId = CurrentUser.id();
        CheckoutResult result = billingService.createCheckout(userId, request.getPlanId());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/redeem-code")
    @Operation(summary = "Nhập mã Gift Code hoặc mã giới thiệu để nhận thêm quà tặng")
    public ResponseEntity<TransactionResponse<RedeemCodeResult>> redeemCode(
            @Valid @RequestBody RedeemCodeRequest request) {
        UUID userId = CurrentUser.id();
        RedeemCodeResult result = billingService.redeemCode(userId, request.getCode());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/feedback")
    @Operation(summary = "Gửi đóng góp ý kiến & phản hồi khi trải nghiệm gói tri ân")
    public ResponseEntity<TransactionResponse<FeedbackResult>> submitFeedback(
            @Valid @RequestBody FeedbackRequest request) {
        UUID userId = CurrentUser.findId().orElse(null);
        FeedbackResult result = billingService.submitFeedback(userId, request);
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @GetMapping("/status/{orderCode}")
    @Operation(summary = "Kiểm tra trạng thái đơn hàng thanh toán (tự động đồng bộ payOS khi chưa có public webhook)")
    public ResponseEntity<TransactionResponse<CheckoutResult>> status(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable long orderCode) {
        UUID userId = CurrentUser.id();
        PaymentTransaction tx = billingService.syncAndGetTransactionStatus(orderCode, userId);
        CheckoutResult result = billingService.toCheckoutResult(tx);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping("/confirm/{orderCode}")
    @Operation(summary = "Xác nhận đã chuyển khoản ngân hàng và kích hoạt gói Premium")
    public ResponseEntity<TransactionResponse<CheckoutResult>> confirm(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable long orderCode) {
        UUID userId = CurrentUser.id();
        CheckoutResult result = billingService.confirmPayment(orderCode, userId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }
}
