package vn.duy.signlight.admin.web.dto;

import java.util.List;
import java.util.UUID;

public final class AdminLmsDtos {

    private AdminLmsDtos() {}

    public record CourseItem(UUID id, String code, String name, String status) {}

    public record CourseListResult(
            List<CourseItem> items,
            int totalPages,
            long totalElements,
            int currentPage
    ) {}

    public record CourseTreeResult(UUID courseId, String courseName, List<UnitItem> units) {}

    public record UnitItem(
            UUID id,
            String title,
            String stableKey,
            int orderIndex,
            boolean isFree,
            int lessonCount,
            List<ChapterItem> chapters
    ) {}

    public record ChapterItem(
            UUID id,
            String title,
            String stableKey,
            int orderIndex,
            int lessonCount
    ) {}

    public record LessonItem(
            UUID id,
            UUID chapterId,
            String title,
            String stableKey,
            int orderIndex,
            String type,
            String status,
            String topic,
            String targetLevel,
            short estimatedMinutes
    ) {}

    public record LessonListResult(
            List<LessonItem> items,
            int totalPages,
            long totalElements,
            int currentPage
    ) {}
}
