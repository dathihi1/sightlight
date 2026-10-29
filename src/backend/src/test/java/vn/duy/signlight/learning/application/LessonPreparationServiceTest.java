package vn.duy.signlight.learning.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import vn.duy.signlight.airecognition.domain.SignAttempt;
import vn.duy.signlight.airecognition.repository.AiModelVersionRepository;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.LessonContentService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.learning.domain.UserLessonSignPractice;
import vn.duy.signlight.learning.repository.UserLessonSignPracticeRepository;

class LessonPreparationServiceTest {

    private ContentTreeService contentTree;
    private LessonContentService lessonContentService;
    private UserLessonSignPracticeRepository practiceRepository;
    private SignAttemptRepository attemptRepository;
    private LessonPreparationService service;
    private UUID userId;
    private UUID lessonId;
    private Sign firstSign;
    private Sign secondSign;

    @BeforeEach
    void setUp() {
        contentTree = mock(ContentTreeService.class);
        lessonContentService = mock(LessonContentService.class);
        practiceRepository = mock(UserLessonSignPracticeRepository.class);
        attemptRepository = mock(SignAttemptRepository.class);
        service = new LessonPreparationService(
                contentTree,
                lessonContentService,
                mock(MediaUrlService.class),
                practiceRepository,
                attemptRepository,
                mock(AiModelVersionRepository.class));
        userId = UUID.randomUUID();
        lessonId = UUID.randomUUID();
        firstSign = sign("Xin chào");
        secondSign = sign("Cảm ơn");

        when(contentTree.requirePublishedLesson(lessonId)).thenReturn(Lesson.builder()
                .id(lessonId).title("Chào hỏi").status("PUBLISHED").build());
        when(lessonContentService.getPublishedBlocks(lessonId)).thenReturn(List.of());
        when(contentTree.exercisesOf(lessonId)).thenReturn(List.of(
                Exercise.builder().id(UUID.randomUUID()).lessonId(lessonId).signId(firstSign.getId()).build(),
                Exercise.builder().id(UUID.randomUUID()).lessonId(lessonId).signId(secondSign.getId()).build()));
        when(contentTree.publishedSigns(org.mockito.ArgumentMatchers.anyCollection()))
                .thenReturn(List.of(firstSign, secondSign));
        when(contentTree.primaryVideos(org.mockito.ArgumentMatchers.anyCollection())).thenReturn(java.util.Map.of());
    }

    @Test
    void preparationCreatesOneOptionalSeparateStepPerWord() {
        when(practiceRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(List.of());

        var result = service.preparation(userId, lessonId);

        assertEquals(2, result.items().size());
        assertEquals("Xin chào", result.items().get(0).title());
        assertFalse(result.items().get(0).locked());
        assertFalse(result.items().get(1).locked());
        assertFalse(result.completed());
    }

    @Test
    void verifiedCameraAttemptCompletesTheRequestedWord() {
        UUID attemptId = UUID.randomUUID();
        SignAttempt attempt = SignAttempt.builder()
                .id(attemptId)
                .userId(userId)
                .targetSignId(firstSign.getId())
                .modelVersionId(UUID.randomUUID())
                .verified(true)
                .createdAt(Instant.now())
                .build();
        UserLessonSignPractice completed = UserLessonSignPractice.builder()
                .userId(userId).lessonId(lessonId).signId(firstSign.getId())
                .attemptId(attemptId).completedAt(Instant.now()).build();
        when(practiceRepository.findByUserIdAndLessonId(userId, lessonId))
                .thenReturn(List.of(completed));
        when(practiceRepository.existsByUserIdAndLessonIdAndSignId(
                userId, lessonId, firstSign.getId())).thenReturn(false);
        when(attemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));

        var result = service.complete(userId, lessonId, firstSign.getId(), attemptId);

        ArgumentCaptor<UserLessonSignPractice> saved = ArgumentCaptor.forClass(UserLessonSignPractice.class);
        verify(practiceRepository).save(saved.capture());
        assertEquals(firstSign.getId(), saved.getValue().getSignId());
        assertEquals("COMPLETED", result.items().get(0).status());
        assertFalse(result.items().get(1).locked());
    }

    private Sign sign(String word) {
        return Sign.builder()
                .id(UUID.randomUUID())
                .courseId(UUID.randomUUID())
                .word(word)
                .meaning(word)
                .status("PUBLISHED")
                .build();
    }
}
