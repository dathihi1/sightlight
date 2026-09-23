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
import vn.duy.signlight.billing.web.dto.CheckoutRequest;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.billing.web.dto.PlanDto;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/billing")
@Tag(name = "billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/plans")
    @Operation(summary = "Danh sách các gói dịch vụ Premium đang mở")
    public ResponseEntity<TransactionResponse<List<PlanDto>>> plans(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<PlanDto> result = billingService.activePlans();
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Tạo liên kết thanh toán payOS cho gói dịch vụ")
    public ResponseEntity<TransactionResponse<CheckoutResult>> checkout(
            @Valid @RequestBody CheckoutRequest request) {
        UUID userId = CurrentUser.id();
        CheckoutResult result = billingService.createCheckout(userId, request.getPlanId());
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
