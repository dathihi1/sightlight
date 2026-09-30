package vn.duy.signlight.learning.application;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.domain.Chapter;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Unit;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;
import vn.duy.signlight.learning.web.dto.LearningPathResult;

class LearningPathServiceTest {

    private ContentCatalogService contentCatalog;
    private ContentTreeService contentTree;
    private UserLessonStateRepository lessonStateRepository;
    private AuthService authService;
    private LearningPathService service;
    private UUID userId;
    private UUID courseId;
    private UUID lessonId;

    @BeforeEach
    void setUp() {
        contentCatalog = mock(ContentCatalogService.class);
        contentTree = mock(ContentTreeService.class);
        lessonStateRepository = mock(UserLessonStateRepository.class);
        authService = mock(AuthService.class);
        service = new LearningPathService(contentCatalog, contentTree, lessonStateRepository, authService);

        userId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        UUID unitId = UUID.randomUUID();
        UUID chapterId = UUID.randomUUID();
        lessonId = UUID.randomUUID();

        Course course = Course.builder()
                .id(courseId)
                .name("Vietnamese Sign Language")
                .code("VSL")
                .status(ContentCatalogService.STATUS_PUBLISHED)
                .alphabetLetters("A-Z")
                .seed(false)
                .build();
        Unit unit = Unit.builder()
                .id(unitId)
                .courseId(courseId)
                .title("Premium Unit")
                .orderIndex(1)
                .free(false)
                .seed(false)
                .build();
        Chapter chapter = Chapter.builder()
                .id(chapterId)
                .unitId(unitId)
                .title("Premium Chapter")
                .orderIndex(1)
                .quizPassPercent((short) 70)
                .seed(false)
                .build();
        Lesson lesson = Lesson.builder()
                .id(lessonId)
                .chapterId(chapterId)
                .title("Premium Lesson")
                .orderIndex(1)
                .type("VIDEO")
                .estimatedMinutes((short) 10)
                .status(ContentCatalogService.STATUS_PUBLISHED)
                .seed(false)
                .build();

        when(contentCatalog.requirePublishedCourse(courseId)).thenReturn(course);
        when(contentTree.tree(courseId)).thenReturn(new ContentTreeService.CourseTree(
                List.of(unit),
                Map.of(unitId, List.of(chapter)),
                Map.of(chapterId, List.of(lesson))));
        when(lessonStateRepository.findByUserId(userId)).thenReturn(List.of());
    }

    @Test
    void allUnitsAreFreeAndUnlockedForFreeUser() {
        when(authService.isPremium(userId)).thenReturn(false);

        LearningPathResult.LessonNode lesson = service.path(userId, courseId)
                .units().get(0).chapters().get(0).lessons().get(0);

        assertFalse(lesson.premiumLocked());
        assertFalse(lesson.locked());
    }

    @Test
    void firstLessonOfUnitIsAlwaysUnlocked() {
        when(authService.isPremium(userId)).thenReturn(false);

        LearningPathResult result = service.path(userId, courseId);
        LearningPathResult.LessonNode lesson = result.units().get(0).chapters().get(0).lessons().get(0);

        assertFalse(lesson.locked());
        assertFalse(lesson.premiumLocked());
    }
}
