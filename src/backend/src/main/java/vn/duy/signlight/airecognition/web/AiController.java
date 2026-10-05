package vn.duy.signlight.airecognition.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.airecognition.application.AiRecognitionService;
import vn.duy.signlight.airecognition.web.dto.AiAttemptRequest;
import vn.duy.signlight.airecognition.web.dto.AiAttemptResult;
import vn.duy.signlight.airecognition.web.dto.AiCapabilitiesResult;
import vn.duy.signlight.airecognition.web.dto.AiPracticeSessionResult;
import vn.duy.signlight.airecognition.web.dto.AiQuotaResult;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

/** api-spec §3.12b–§3.12c — module M10, nhận diện ký hiệu động (FR-41 → FR-44). */
@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "airecognition")
public class AiController {

    private static final int DEFAULT_SESSION_SIZE = 10;

    private final AiRecognitionService recognitionService;

    public AiController(AiRecognitionService recognitionService) {
        this.recognitionService = recognitionService;
    }

    @GetMapping("/capabilities")
    @Operation(summary = "Vốn ký hiệu AI + thông số schema (FR-41, FR-44)")
    public ResponseEntity<TransactionResponse<AiCapabilitiesResult>> capabilities(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(
                ApiResponses.ok(requestId, recognitionService.capabilities(CurrentUser.id())));
    }

    @PostMapping("/attempts")
    @Operation(summary = "Chấm một lượt ký hiệu động (FR-41 → FR-43)")
    public ResponseEntity<TransactionResponse<AiAttemptResult>> attempt(
            @Valid @RequestBody AiAttemptRequest request) {
        AiAttemptResult result = recognitionService.score(CurrentUser.id(), request);
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @GetMapping("/quota")
    @Operation(summary = "Hạn mức lượt luyện AI còn lại hôm nay (FR-30)")
    public ResponseEntity<TransactionResponse<AiQuotaResult>> quota(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(
                ApiResponses.ok(requestId, recognitionService.quota(CurrentUser.id())));
    }

    @GetMapping("/practice/session")
    @Operation(summary = "Phiên luyện ký hiệu động — chỉ ký hiệu có chấm AI (BR-A111)")
    public ResponseEntity<TransactionResponse<AiPracticeSessionResult>> practiceSession(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(required = false) java.util.UUID signId,
            @RequestParam(defaultValue = "" + DEFAULT_SESSION_SIZE) int size) {
        // Tối đa 400 để màn luyện có thể hiển thị toàn bộ vốn từ và cho người dùng tự chọn.
        int bounded = Math.clamp(size, 1, 400);
        return ResponseEntity.ok(
                ApiResponses.ok(requestId,
                        recognitionService.practiceSession(CurrentUser.id(), signId, bounded)));
    }
}
