package vn.duy.signlight.referral.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.referral.application.ReferralService;
import vn.duy.signlight.referral.web.dto.ClaimReferralCodeRequest;
import vn.duy.signlight.referral.web.dto.ReferralSummaryResult;

@RestController
@RequestMapping("/api/v1/referral")
@Tag(name = "referral", description = "Hệ thống giới thiệu bạn bè nhận 1 tháng Premium")
public class ReferralController {

    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Xem mã giới thiệu, số bạn bè đã mời và trạng thái nhận thưởng")
    public ResponseEntity<TransactionResponse<ReferralSummaryResult>> getSummary(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        ReferralSummaryResult result = referralService.getSummary(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping("/claim-code")
    @Operation(summary = "Nhập mã giới thiệu của bạn bè thủ công")
    public ResponseEntity<TransactionResponse<ReferralSummaryResult>> claimCode(
            @Valid @RequestBody ClaimReferralCodeRequest request) {
        ReferralSummaryResult result = referralService.claimCode(CurrentUser.id(), request.getReferralCode());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/claim-reward")
    @Operation(summary = "Kích hoạt nhận 1 tháng Premium khi đã mời đủ 5 người")
    public ResponseEntity<TransactionResponse<ReferralSummaryResult>> claimReward(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        ReferralSummaryResult result = referralService.claimReward(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }
}
