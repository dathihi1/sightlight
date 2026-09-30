package vn.duy.signlight.content.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.web.dto.CourseListResult;
import vn.duy.signlight.learning.application.LearningPathService;
import vn.duy.signlight.learning.web.dto.LearningPathResult;

/** api-spec §2 endpoint 24 và §3.4 — danh sách khoá (công khai) và lộ trình học (cần đăng nhập). */
@RestController
@RequestMapping("/api/v1/courses")
@Tag(name = "content")
public class CourseController {

    private final ContentCatalogService contentCatalog;
    private final LearningPathService learningPathService;

    public CourseController(ContentCatalogService contentCatalog,
            LearningPathService learningPathService) {
        this.contentCatalog = contentCatalog;
        this.learningPathService = learningPathService;
    }

    @GetMapping
    @Operation(summary = "Khoá học đang mở (FR-05, FR-10)")
    public ResponseEntity<TransactionResponse<CourseListResult>> courses(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        var items = contentCatalog.publishedCourses().stream()
                .map(this::toItem)
                .toList();
        return ResponseEntity.ok(ApiResponses.ok(requestId, new CourseListResult(items)));
    }

    @GetMapping("/{courseId}/path")
    @Operation(summary = "Lộ trình học kèm tiến độ (FR-09)")
    public ResponseEntity<TransactionResponse<LearningPathResult>> path(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable UUID courseId) {
        LearningPathResult result = learningPathService.path(CurrentUser.findId().orElse(null), courseId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    private CourseListResult.CourseItem toItem(Course course) {
        return new CourseListResult.CourseItem(
                course.getId(), course.getCode(), course.getName(), course.getStatus(), false);
    }
}
