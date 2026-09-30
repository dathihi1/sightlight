package vn.duy.signlight.notification.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.mail.EmailService;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.notification.domain.Notification;
import vn.duy.signlight.notification.repository.NotificationRepository;
import vn.duy.signlight.notification.web.dto.NotificationDto;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final AppUserRepository userRepository;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository notificationRepository,
            AppUserRepository userRepository,
            EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Transactional
    public Notification sendNotification(UUID userId, String title, String content, String type, String targetUrl) {
        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .title(title)
                .content(content)
                .type(type != null ? type : "SYSTEM")
                .targetUrl(targetUrl)
                .read(false)
                .createdAt(Instant.now())
                .build();
        Notification saved = notificationRepository.save(notification);
        log.info("notification_created user_id={} notif_id={} type={}", userId, saved.getId(), type);
        return saved;
    }

    @Transactional(readOnly = true)
    public NotificationDto.ListResult getUserNotifications(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(50, size)));
        Page<Notification> paged = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        long unreadCount = notificationRepository.countByUserIdAndReadFalse(userId);

        List<NotificationDto> dtoList = paged.getContent().stream()
                .map(NotificationDto::from)
                .toList();

        return new NotificationDto.ListResult(dtoList, unreadCount, paged.getTotalPages(), paged.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getRecentNotifications(UUID userId) {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public boolean markAsRead(UUID userId, UUID notificationId) {
        return notificationRepository.findById(notificationId)
                .filter(n -> n.getUserId().equals(userId))
                .map(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                    return true;
                })
                .orElse(false);
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId);
    }
}
