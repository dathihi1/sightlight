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
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.learning.application.LessonService;
import vn.duy.signlight.learning.application.LessonPreparationService;
import vn.duy.signlight.learning.web.dto.AnswerRequest;
import vn.duy.signlight.learning.web.dto.AnswerResult;
import vn.duy.signlight.learning.web.dto.CompleteLessonRequest;
import vn.duy.signlight.learning.web.dto.CompleteLessonResult;
import vn.duy.signlight.learning.web.dto.CompleteSignPracticeRequest;
import vn.duy.signlight.learning.web.dto.LessonResult;
import vn.duy.signlight.learning.web.dto.LessonPreparationResult;

/** api-spec §3.5–§3.7 — nội dung bài học, nộp câu trả lời, hoàn thành bài. */
@RestController
@RequestMapping("/api/v1/lessons")
@Tag(name = "learning")
public class LessonController {

    private final LessonService lessonService;
    private final LessonPreparationService preparationService;

    public LessonController(LessonService lessonService, LessonPreparationService preparationService) {
        this.lessonService = lessonService;
        this.preparationService = preparationService;
    }

    @GetMapping("/{lessonId}/preparation")
    @Operation(summary = "Danh sách bài luyện từng từ trước lesson chính")
    public ResponseEntity<TransactionResponse<LessonPreparationResult>> preparation(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable UUID lessonId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId,
                preparationService.preparation(CurrentUser.id(), lessonId)));
    }

    @PostMapping("/{lessonId}/preparation/{signId}/complete")
    @Operation(summary = "Hoàn thành một bài luyện từ bằng lượt Camera AI đã được chấm")
    public ResponseEntity<TransactionResponse<LessonPreparationResult>> completePreparation(
            @PathVariable UUID lessonId,
            @PathVariable UUID signId,
            @Valid @RequestBody CompleteSignPracticeRequest request) {
        LessonPreparationResult result = preparationService.complete(
                CurrentUser.id(), lessonId, signId, request.getAttemptId());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @GetMapping("/{lessonId}")
    @Operation(summary = "Nội dung bài học + bài tập (FR-11, FR-12)")
    public ResponseEntity<TransactionResponse<LessonResult>> lesson(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable UUID lessonId) {
        return ResponseEntity.ok(
                ApiResponses.ok(requestId, lessonService.lesson(CurrentUser.id(), lessonId)));
    }

    @PostMapping("/{lessonId}/exercises/{exerciseId}/answer")
    @Operation(summary = "Nộp câu trả lời — chấm ở server (FR-12, ADR-04)")
    public ResponseEntity<TransactionResponse<AnswerResult>> answer(
            @PathVariable UUID lessonId,
            @PathVariable UUID exerciseId,
            @Valid @RequestBody AnswerRequest request) {
        AnswerResult result = lessonService.submitAnswer(
                CurrentUser.id(), lessonId, exerciseId, request);
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/{lessonId}/complete")
    @Operation(summary = "Hoàn thành bài học — idempotent theo idempotencyKey (FR-16, BR-A31)")
    public ResponseEntity<TransactionResponse<CompleteLessonResult>> complete(
            @PathVariable UUID lessonId,
            @Valid @RequestBody CompleteLessonRequest request) {
        CompleteLessonResult result = lessonService.complete(CurrentUser.id(), lessonId, request);
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }
}
