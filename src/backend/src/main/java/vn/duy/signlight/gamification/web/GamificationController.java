package vn.duy.signlight.gamification.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.gamification.application.GamificationQueryService;
import vn.duy.signlight.gamification.web.dto.GamificationSummaryResult;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import vn.duy.signlight.gamification.application.GamificationStoreService;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemRequest;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemResult;
import vn.duy.signlight.gamification.web.dto.StoreCatalogResult;

@RestController
@RequestMapping("/api/v1/gamification")
@Tag(name = "gamification")
public class GamificationController {

    private final GamificationQueryService gamificationQueryService;
    private final GamificationStoreService gamificationStoreService;

    public GamificationController(
            GamificationQueryService gamificationQueryService,
            GamificationStoreService gamificationStoreService) {
        this.gamificationQueryService = gamificationQueryService;
        this.gamificationStoreService = gamificationStoreService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Tổng quan gamification: streak, hoạt động gần đây, tiến độ")
    public ResponseEntity<TransactionResponse<GamificationSummaryResult>> summary(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "courseId", required = false) UUID courseId) {
        GamificationSummaryResult result = gamificationQueryService.summary(CurrentUser.id(), courseId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/store")
    @Operation(summary = "Xem danh mục vật phẩm và số dư EXP đổi thưởng")
    public ResponseEntity<TransactionResponse<StoreCatalogResult>> store(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        StoreCatalogResult result = gamificationStoreService.catalog(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping("/store/redeem")
    @Operation(summary = "Dùng EXP đổi vật phẩm / huy hiệu / lượt AI")
    public ResponseEntity<TransactionResponse<RedeemStoreItemResult>> redeem(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @Valid @RequestBody RedeemStoreItemRequest request) {
        RedeemStoreItemResult result = gamificationStoreService.redeem(CurrentUser.id(), request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }
}
