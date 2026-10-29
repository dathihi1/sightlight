package vn.duy.signlight.notification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.common.mail.EmailService;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.notification.domain.Notification;
import vn.duy.signlight.notification.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PushOutboxService pushOutboxService;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(
                notificationRepository,
                userRepository,
                emailService,
                pushOutboxService);
    }

    @Test
    void savedNotificationIsEnqueuedForPushDelivery() {
        UUID userId = UUID.randomUUID();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(call -> call.getArgument(0));

        Notification saved = notificationService.sendNotification(
                userId,
                "Tiến độ mới",
                "Bạn đã hoàn thành một bài học.",
                "PROGRESS",
                "/hoc");

        assertEquals(userId, saved.getUserId());
        assertEquals("PROGRESS", saved.getType());
        verify(pushOutboxService).enqueue(saved);
    }
}
