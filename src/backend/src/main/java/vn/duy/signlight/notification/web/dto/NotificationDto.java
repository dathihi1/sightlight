package vn.duy.signlight.notification.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import vn.duy.signlight.notification.domain.Notification;

public record NotificationDto(
        UUID id,
        String title,
        String content,
        String type,
        String targetUrl,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.getType(),
                n.getTargetUrl(),
                n.isRead(),
                n.getCreatedAt()
        );
    }

    public record ListResult(
            List<NotificationDto> items,
            long unreadCount,
            int totalPages,
            long totalElements
    ) {}
}
