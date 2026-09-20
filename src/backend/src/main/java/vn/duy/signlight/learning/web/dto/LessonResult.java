package vn.duy.signlight.learning.web.dto;

import java.util.List;
import java.util.UUID;

/**
 * api-spec §3.5 — nội dung bài học.
 *
 * <p>Không trường nào ở đây được mang đáp án đúng: `options[]` **không có** `isCorrect`, và
 * `tokens[]` đã bị xáo trộn (AC-12.4, ADR-04).
 */
public record LessonResult(
        UUID lessonId,
        String title,
        String type,
        int resumeAtIndex,
        List<ExerciseNode> exercises) {

    public record ExerciseNode(
            UUID id,
            String type,
            String promptText,
            String videoUrl,
            boolean placeholderVideo,
            List<OptionNode> options,
            List<String> tokens) {
    }

    public record OptionNode(UUID id, String labelText, String videoUrl) {
    }
}
