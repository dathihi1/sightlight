package vn.duy.signlight.admin.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.admin.application.AdminLmsService;
import vn.duy.signlight.admin.web.dto.AdminLessonDetailDto;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "admin-lms")
@PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_CREATOR', 'CONTENT_APPROVER')")
public class AdminLmsController {

    private final AdminLmsService adminLmsService;

    public AdminLmsController(AdminLmsService adminLmsService) {
        this.adminLmsService = adminLmsService;
    }

    @GetMapping("/lessons/{lessonId}/builder")
    @Operation(summary = "Lấy chi tiết bài học cùng danh sách bài tập và blocks để chỉnh sửa")
    public ResponseEntity<TransactionResponse<AdminLessonDetailDto>> getLessonDetail(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId) {
        AdminLessonDetailDto result = adminLmsService.getLessonDetail(lessonId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PutMapping("/lessons/{lessonId}/reorder-exercises")
    @Operation(summary = "Sắp xếp lại thứ tự bài tập trong 1 bài học")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> reorderExercises(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId,
            @RequestBody AdminLessonDetailDto.ReorderRequest request) {
        adminLmsService.reorderExercises(lessonId, request.orderedIds());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PutMapping("/lessons/{lessonId}/reorder-blocks")
    @Operation(summary = "Sắp xếp lại thứ tự content blocks trong 1 bài học")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> reorderBlocks(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId,
            @RequestBody AdminLessonDetailDto.ReorderRequest request) {
        adminLmsService.reorderBlocks(lessonId, request.orderedIds());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PostMapping("/lessons/{lessonId}/exercises")
    @Operation(summary = "Thêm bài tập mới vào bài học")
    public ResponseEntity<TransactionResponse<Map<String, UUID>>> createExercise(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId,
            @RequestBody AdminLessonDetailDto.ExerciseUpsertRequest request) {
        UUID createdId = adminLmsService.createExercise(lessonId, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("exerciseId", createdId)));
    }

    @PutMapping("/exercises/{exerciseId}")
    @Operation(summary = "Cập nhật nội dung bài tập")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateExercise(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("exerciseId") UUID exerciseId,
            @RequestBody AdminLessonDetailDto.ExerciseUpsertRequest request) {
        adminLmsService.updateExercise(exerciseId, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @DeleteMapping("/exercises/{exerciseId}")
    @Operation(summary = "Xóa bài tập khỏi bài học")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> deleteExercise(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("exerciseId") UUID exerciseId) {
        adminLmsService.deleteExercise(exerciseId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PostMapping("/lessons/{lessonId}/blocks")
    @Operation(summary = "Thêm khối nội dung mới vào bài học")
    public ResponseEntity<TransactionResponse<Map<String, UUID>>> createBlock(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId,
            @RequestBody AdminLessonDetailDto.BlockUpsertRequest request) {
        UUID createdId = adminLmsService.createBlock(lessonId, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("blockId", createdId)));
    }

    @PutMapping("/blocks/{blockId}")
    @Operation(summary = "Cập nhật khối nội dung")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateBlock(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("blockId") UUID blockId,
            @RequestBody AdminLessonDetailDto.BlockUpsertRequest request) {
        adminLmsService.updateBlock(blockId, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @DeleteMapping("/blocks/{blockId}")
    @Operation(summary = "Xóa khối nội dung khỏi bài học")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> deleteBlock(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("blockId") UUID blockId) {
        adminLmsService.deleteBlock(blockId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    public record LessonUpdateRequest(
            String title,
            String summary,
            String topic,
            String targetLevel,
            String status,
            Short estimatedMinutes
    ) {}

    @PatchMapping("/lessons/{lessonId}")
    @Operation(summary = "Cập nhật thông tin tiêu đề, mô tả, độ khó của bài học")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateLesson(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("lessonId") UUID lessonId,
            @RequestBody LessonUpdateRequest req) {
        adminLmsService.updateLesson(lessonId, req.title(), req.summary(), req.topic(), req.targetLevel(), req.status(), req.estimatedMinutes());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }
}
