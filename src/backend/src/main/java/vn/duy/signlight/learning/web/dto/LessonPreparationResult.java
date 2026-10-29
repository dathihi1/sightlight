package vn.duy.signlight.learning.web.dto;

import java.util.List;
import java.util.UUID;

/** Các bài luyện từng từ phải hoàn thành trước lesson chính. */
public record LessonPreparationResult(
        UUID lessonId,
        String lessonTitle,
        boolean completed,
        List<Item> items) {

    public record Item(
            UUID signId,
            String title,
            String meaning,
            String videoUrl,
            boolean placeholderVideo,
            String status,
            boolean locked,
            int orderIndex) {
    }
}
