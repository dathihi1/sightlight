package vn.duy.signlight.learning.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §3.4 — cây Unit → Chapter → Lesson kèm trạng thái và cờ khoá (FR-09). */
public record LearningPathResult(
        UUID courseId,
        String courseName,
        UUID nextLessonId,
        List<UnitNode> units) {

    public record UnitNode(
            UUID id,
            String title,
            boolean isFree,
            int starsEarned,
            List<ChapterNode> chapters) {
    }

    public record ChapterNode(
            UUID id,
            String title,
            boolean quizPassed,
            List<LessonNode> lessons) {
    }

    public record LessonNode(
            UUID id,
            String title,
            String status,
            boolean locked,
            boolean premiumLocked,
            Short bestScorePercent) {
    }
}
