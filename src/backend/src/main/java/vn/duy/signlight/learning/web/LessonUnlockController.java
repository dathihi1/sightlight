package vn.duy.signlight.learning.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.learning.application.LessonUnlockService;
import vn.duy.signlight.learning.web.dto.LessonUnlockResult;

/** Mở nhanh bài học: hoàn thành bài trước vẫn là cách mở mặc định, EXP/vé là lựa chọn chủ động. */
@RestController
@RequestMapping("/api/v1/lessons")
@Tag(name = "lesson-unlock", description = "Mở nhanh bài học bằng EXP hoặc vé mở khóa")
public class LessonUnlockController {

    private final LessonUnlockService lessonUnlockService;

    public LessonUnlockController(LessonUnlockService lessonUnlockService) {
        this.lessonUnlockService = lessonUnlockService;
    }

    @PostMapping("/{lessonId}/unlock-exp")
    @Operation(summary = "Mở khóa vĩnh viễn một bài học bằng 5.000 EXP")
    public ResponseEntity<TransactionResponse<LessonUnlockResult>> unlockWithExp(
            @PathVariable UUID lessonId,
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId,
                lessonUnlockService.unlockWithExp(CurrentUser.id(), lessonId)));
    }

    @PostMapping("/{lessonId}/unlock-ticket")
    @Operation(summary = "Mở khóa vĩnh viễn một bài học bằng vé mở khóa")
    public ResponseEntity<TransactionResponse<LessonUnlockResult>> unlockWithTicket(
            @PathVariable UUID lessonId,
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId,
                lessonUnlockService.unlockWithTicket(CurrentUser.id(), lessonId)));
    }
}
