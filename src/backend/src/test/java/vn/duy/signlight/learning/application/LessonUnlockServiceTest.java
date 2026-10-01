package vn.duy.signlight.learning.application;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.billing.application.PayOsClient;
import vn.duy.signlight.billing.repository.PaymentTransactionRepository;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.learning.domain.UserUnlockedLesson;
import vn.duy.signlight.learning.repository.UserUnlockedLessonRepository;
import vn.duy.signlight.learning.web.dto.LessonUnlockResult;
import vn.duy.signlight.notification.application.NotificationService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LessonUnlockServiceTest {

    @Mock
    private UserUnlockedLessonRepository unlockedLessonRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private LessonRepository lessonRepository;

    @Mock
    private PayOsClient payOsClient;

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private NotificationService notificationService;

    private LessonUnlockService unlockService;

    @BeforeEach
    void setUp() {
        unlockService = new LessonUnlockService(
                unlockedLessonRepository,
                userProfileRepository,
                lessonRepository,
                payOsClient,
                transactionRepository,
                notificationService
        );
    }

    @Test
    @DisplayName("Mở khóa bài học bằng 5000 EXP (thuê 1 tháng) thành công")
    void unlockWithExp_rent1M_success() {
        UUID userId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();

        Lesson lesson = Lesson.builder().id(lessonId).title("Bài 1").build();
        UserProfile profile = UserProfile.builder().userId(userId).expBalance(6000).build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(unlockedLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.empty());
        when(unlockedLessonRepository.save(any(UserUnlockedLesson.class))).thenAnswer(i -> i.getArgument(0));

        LessonUnlockResult result = unlockService.unlockWithExp(userId, lessonId, "RENT_1M");

        assertEquals(1000, profile.getExpBalance());
        assertEquals(5000, result.amountPaid());
        assertEquals("RENT_1M", result.unlockType());
        assertNotNull(result.expiresAt());
        verify(userProfileRepository).save(profile);
    }

    @Test
    @DisplayName("Mở khóa bài học bằng 25000 EXP (vĩnh viễn) thành công")
    void unlockWithExp_permanent_success() {
        UUID userId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();

        Lesson lesson = Lesson.builder().id(lessonId).title("Bài 1").build();
        UserProfile profile = UserProfile.builder().userId(userId).expBalance(30000).build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(unlockedLessonRepository.findByUserIdAndLessonId(userId, lessonId)).thenReturn(Optional.empty());
        when(unlockedLessonRepository.save(any(UserUnlockedLesson.class))).thenAnswer(i -> i.getArgument(0));

        LessonUnlockResult result = unlockService.unlockWithExp(userId, lessonId, "PERMANENT");

        assertEquals(5000, profile.getExpBalance());
        assertEquals(25000, result.amountPaid());
        assertEquals("PERMANENT", result.unlockType());
        assertNull(result.expiresAt());
        assertTrue(result.isPermanent());
    }

    @Test
    @DisplayName("Báo lỗi khi không đủ điểm EXP để mở khóa")
    void unlockWithExp_insufficientExp_throws() {
        UUID userId = UUID.randomUUID();
        UUID lessonId = UUID.randomUUID();

        Lesson lesson = Lesson.builder().id(lessonId).title("Bài 1").build();
        UserProfile profile = UserProfile.builder().userId(userId).expBalance(2000).build();

        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> unlockService.unlockWithExp(userId, lessonId, "RENT_1M"));
        assertEquals(ErrorCode.EXP_INSUFFICIENT.getCode(), ex.getErrorCode());
    }
}
