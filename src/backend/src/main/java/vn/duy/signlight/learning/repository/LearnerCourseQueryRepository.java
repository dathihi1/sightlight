package vn.duy.signlight.learning.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Bounded read model queries used by learner course screens and lesson authorization. */
public interface LearnerCourseQueryRepository {

    List<OverviewUnitView> overviewUnits(UUID userId, UUID courseId);

    List<OverviewChapterView> overviewChapters(UUID userId, UUID courseId);

    ChapterLessonPage chapterLessons(UUID userId, UUID courseId, UUID chapterId, int page, int size);

    Optional<LessonSummaryView> nextLesson(UUID userId, UUID courseId);

    Optional<LessonAccessView> lessonAccess(UUID userId, UUID lessonId);

    record OverviewUnitView(UUID id, String title, int orderIndex, long lessonCount,
            long completedLessons, double averageScore) {
    }

    record OverviewChapterView(UUID id, UUID unitId, String title, int orderIndex,
            long lessonCount, long completedLessons) {
    }

    record LessonSummaryView(UUID id, UUID chapterId, String title, String status,
            Short bestScorePercent, boolean locked, boolean premiumLocked) {
    }

    record LessonAccessView(UUID courseId, boolean unlocked, boolean premiumLocked) {
    }

    record ChapterLessonPage(List<LessonSummaryView> items, long totalElements, boolean chapterFound) {
        public ChapterLessonPage(List<LessonSummaryView> items, long totalElements) {
            this(items, totalElements, true);
        }

        public static ChapterLessonPage chapterNotFound() {
            return new ChapterLessonPage(List.of(), 0, false);
        }
    }
}
