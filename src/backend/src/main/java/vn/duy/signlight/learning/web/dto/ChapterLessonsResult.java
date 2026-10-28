package vn.duy.signlight.learning.web.dto;

import java.util.List;
import java.util.UUID;

/** One bounded page of published lessons for a chapter. */
public record ChapterLessonsResult(
        List<LessonItem> items,
        int totalPages,
        long totalElements,
        int currentPage) {

    public record LessonItem(
            UUID id,
            String title,
            String status,
            boolean locked,
            boolean premiumLocked,
            Short bestScorePercent) {
    }
}
