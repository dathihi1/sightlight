package vn.duy.signlight.learning.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.billing.web.dto.CheckoutResult;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.learning.application.LessonUnlockService;
import vn.duy.signlight.learning.domain.UserUnlockedLesson;
import vn.duy.signlight.learning.web.dto.LessonUnlockResult;
import vn.duy.signlight.learning.web.dto.UnlockLessonRequest;

@RestController
@RequestMapping("/api/v1/lessons")
@Tag(name = "lesson-unlock", description = "Mở khóa bài học bằng 5k/25k VND hoặc 5k/25k EXP")
public class LessonUnlockController {

    private final LessonUnlockService unlockService;

    public LessonUnlockController(LessonUnlockService unlockService) {
        this.unlockService = unlockService;
    }

    @PostMapping("/{lessonId}/unlock-exp")
    @Operation(summary = "Mở khóa bài học bằng điểm EXP (5000 EXP thuê 1 tháng, 25000 EXP vĩnh viễn)")
    public ResponseEntity<TransactionResponse<LessonUnlockResult>> unlockWithExp(
            @PathVariable UUID lessonId,
            @Valid @RequestBody UnlockLessonRequest request) {
        LessonUnlockResult result = unlockService.unlockWithExp(CurrentUser.id(), lessonId, request.getUnlockType());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/{lessonId}/unlock-payos")
    @Operation(summary = "Tạo link thanh toán PayOS mở khóa bài học (5000đ thuê 1 tháng, 25000đ vĩnh viễn)")
    public ResponseEntity<TransactionResponse<CheckoutResult>> unlockWithPayOs(
            @PathVariable UUID lessonId,
            @Valid @RequestBody UnlockLessonRequest request) {
        CheckoutResult result = unlockService.createPayOsCheckout(CurrentUser.id(), lessonId, request.getUnlockType());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @GetMapping("/{lessonId}/unlock-status")
    @Operation(summary = "Kiểm tra trạng thái mở khóa của bài học cho học viên hiện tại")
    public ResponseEntity<TransactionResponse<LessonUnlockResult>> getUnlockStatus(
            @PathVariable UUID lessonId,
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        var opt = unlockService.getActiveUnlock(CurrentUser.id(), lessonId);
        LessonUnlockResult result = opt.map(u -> new LessonUnlockResult(
                lessonId,
                u.getUnlockType(),
                u.getPaidBy(),
                u.getAmount(),
                u.getExpiresAt(),
                u.getExpiresAt() == null,
                0
        )).orElse(null);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }
}
