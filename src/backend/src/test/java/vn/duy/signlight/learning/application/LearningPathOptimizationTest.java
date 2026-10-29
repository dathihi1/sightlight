package vn.duy.signlight.learning.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository.ChapterLessonPage;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository.LessonAccessView;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository.LessonSummaryView;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository.OverviewChapterView;
import vn.duy.signlight.learning.repository.LearnerCourseQueryRepository.OverviewUnitView;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;
import vn.duy.signlight.learning.web.dto.ChapterLessonsResult;
import vn.duy.signlight.learning.web.dto.CourseOverviewResult;

class LearningPathOptimizationTest {

    private ContentCatalogService contentCatalog;
    private ContentTreeService contentTree;
    private UserLessonStateRepository lessonStateRepository;
    private AuthService authService;
    private LearnerCourseQueryRepository learnerQueries;
    private LearningPathService service;
    private UUID userId;
    private UUID courseId;
    private UUID unitId;
    private UUID chapterId;

    @BeforeEach
    void setUp() {
        contentCatalog = mock(ContentCatalogService.class);
        contentTree = mock(ContentTreeService.class);
        lessonStateRepository = mock(UserLessonStateRepository.class);
        authService = mock(AuthService.class);
        learnerQueries = mock(LearnerCourseQueryRepository.class);
        service = new LearningPathService(contentCatalog, contentTree, lessonStateRepository,
                authService, null, null, learnerQueries);
        userId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        chapterId = UUID.randomUUID();
        when(contentCatalog.requirePublishedCourse(courseId)).thenReturn(Course.builder()
                .id(courseId).code("VSL").name("VSL").status("PUBLISHED")
                .alphabetLetters("A-Z").build());
    }

    @Test
    void overviewReturnsMetadataAndAggregatesWithoutBuildingFullPath() {
        UUID nextLessonId = UUID.randomUUID();
        when(learnerQueries.overviewUnits(userId, courseId)).thenReturn(List.of(
                new OverviewUnitView(unitId, "Unit 1", 0, 4, 2, 85.0)));
        when(learnerQueries.overviewChapters(userId, courseId)).thenReturn(List.of(
                new OverviewChapterView(chapterId, unitId, "Chapter 1", 0, 4, 2)));
        when(learnerQueries.nextLesson(userId, courseId)).thenReturn(Optional.of(
                new LessonSummaryView(nextLessonId, chapterId, "Lesson 3", "NOT_STARTED", null,
                        false, false)));

        CourseOverviewResult result = service.overview(userId, courseId);

        assertEquals(4, result.totalLessons());
        assertEquals(2, result.completedLessons());
        assertEquals(85, result.averageScore());
        assertEquals(nextLessonId, result.nextLesson().id());
        assertEquals(1, result.units().size());
        assertEquals(1, result.units().getFirst().chapters().size());
        assertFalse(result.units().getFirst().chapters().getFirst().lessonsIncluded());
        verify(contentTree, never()).tree(courseId);
        verify(lessonStateRepository, never()).findByUserId(userId);
    }

    @Test
    void chapterLessonsUsesBoundedDatabasePageAndPreservesAccessFlags() {
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        when(learnerQueries.chapterLessons(userId, courseId, chapterId, 1, 2))
                .thenReturn(new ChapterLessonPage(List.of(
                        new LessonSummaryView(first, chapterId, "Across chapter boundary", "NOT_STARTED", null,
                                true, false),
                        new LessonSummaryView(second, chapterId, "Active unlock", "IN_PROGRESS", (short) 90,
                                false, false)), 5));

        ChapterLessonsResult result = service.chapterLessons(userId, courseId, chapterId, 1, 2);

        assertEquals(1, result.currentPage());
        assertEquals(3, result.totalPages());
        assertEquals(5, result.totalElements());
        assertTrue(result.items().getFirst().locked());
        assertFalse(result.items().get(1).locked());
        assertFalse(result.items().get(1).premiumLocked());
        verify(learnerQueries).chapterLessons(userId, courseId, chapterId, 1, 2);
        verify(contentTree, never()).tree(courseId);
    }

    @Test
    void chapterLessonsRejectsInvalidPaginationBeforeQueryingDatabase() {
        assertThrows(BusinessException.class,
                () -> service.chapterLessons(userId, courseId, chapterId, -1, 20));
        assertThrows(BusinessException.class,
                () -> service.chapterLessons(userId, courseId, chapterId, 0, 101));

        verify(learnerQueries, never()).chapterLessons(userId, courseId, chapterId, -1, 20);
        verify(learnerQueries, never()).chapterLessons(userId, courseId, chapterId, 0, 101);
    }

    @Test
    void chapterLessonsRejectsChapterOutsidePublishedCourse() {
        when(learnerQueries.chapterLessons(userId, courseId, chapterId, 0, 20))
                .thenReturn(ChapterLessonPage.chapterNotFound());

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.chapterLessons(userId, courseId, chapterId, 0, 20));

        assertEquals("00404", error.getErrorCode());
    }

    @Test
    void accessUsesSingleLessonDecisionWithGlobalPassAllocation() {
        UUID lessonId = UUID.randomUUID();
        Lesson lesson = Lesson.builder().id(lessonId).chapterId(chapterId).status("PUBLISHED").build();
        when(learnerQueries.lessonAccess(userId, lessonId))
                .thenReturn(Optional.of(new LessonAccessView(courseId, true, false)));

        LearningPathService.Access access = service.accessTo(userId, lesson);

        assertTrue(access.unlocked());
        assertFalse(access.premiumLocked());
        verify(learnerQueries).lessonAccess(userId, lessonId);
        verify(contentTree, never()).tree(courseId);
        verify(lessonStateRepository, never()).findByUserId(userId);
    }

    @Test
    void optionalCameraPracticeDoesNotBlockTheMainLesson() {
        UUID lessonId = UUID.randomUUID();
        Lesson lesson = Lesson.builder().id(lessonId).chapterId(chapterId).status("PUBLISHED").build();
        LessonPreparationService optionalPreparation = mock(LessonPreparationService.class);
        LearningPathService serviceWithPreparation = new LearningPathService(
                contentCatalog, contentTree, lessonStateRepository, authService,
                null, null, learnerQueries, optionalPreparation);
        when(learnerQueries.lessonAccess(userId, lessonId))
                .thenReturn(Optional.of(new LessonAccessView(courseId, true, false)));

        LearningPathService.Access access = serviceWithPreparation.accessTo(userId, lesson);

        assertTrue(access.unlocked());
        verify(optionalPreparation, never()).allCompleted(userId, lessonId);
    }

    @Test
    void nextLessonUsesDirectBoundedLookup() {
        UUID nextLessonId = UUID.randomUUID();
        when(learnerQueries.nextLesson(userId, courseId)).thenReturn(Optional.of(
                new LessonSummaryView(nextLessonId, chapterId, "Next", "NOT_STARTED", null,
                        false, false)));

        assertEquals(nextLessonId, service.nextLessonId(userId, courseId));
        verify(learnerQueries).nextLesson(userId, courseId);
        verify(contentTree, never()).tree(courseId);
    }
}
