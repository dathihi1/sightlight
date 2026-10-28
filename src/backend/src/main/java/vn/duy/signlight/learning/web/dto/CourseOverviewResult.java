package vn.duy.signlight.learning.web.dto;

import java.util.List;
import java.util.UUID;

/** Lightweight course metadata and learner aggregates; lesson arrays are intentionally excluded. */
public record CourseOverviewResult(
        UUID courseId,
        String courseName,
        int totalLessons,
        int completedLessons,
        int averageScore,
        NextLesson nextLesson,
        List<UnitOverview> units) {

    public record NextLesson(UUID id, UUID chapterId, String title, String status) {
    }

    public record UnitOverview(
            UUID id,
            String title,
            boolean isFree,
            int lessonCount,
            int completedLessons,
            int averageScore,
            List<ChapterOverview> chapters) {
    }

    public record ChapterOverview(
            UUID id,
            String title,
            int lessonCount,
            int completedLessons,
            boolean lessonsIncluded) {
    }
}
