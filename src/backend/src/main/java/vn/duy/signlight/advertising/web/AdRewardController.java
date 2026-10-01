package vn.duy.signlight.advertising.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.advertising.application.AdRewardService;
import vn.duy.signlight.advertising.web.dto.AdRewardResult;
import vn.duy.signlight.advertising.web.dto.ClaimAdRewardRequest;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/ads")
@Tag(name = "advertising", description = "Xem video quảng cáo nhận lượt AI và EXP miễn phí")
public class AdRewardController {

    private final AdRewardService adRewardService;

    public AdRewardController(AdRewardService adRewardService) {
        this.adRewardService = adRewardService;
    }

    @PostMapping("/claim-reward")
    @Operation(summary = "Xác nhận đã xem video quảng cáo và nhận thưởng (AI_QUOTA hoặc EXP)")
    public ResponseEntity<TransactionResponse<AdRewardResult>> claimReward(
            @Valid @RequestBody ClaimAdRewardRequest request) {
        AdRewardResult result = adRewardService.claimReward(
                CurrentUser.id(), request.getRewardType(), request.getPlacement());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }
}
