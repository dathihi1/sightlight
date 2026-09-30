package vn.duy.signlight.notification.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.notification.application.NotificationService;
import vn.duy.signlight.notification.web.dto.NotificationDto;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "notification")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
    public ResponseEntity<TransactionResponse<NotificationDto.ListResult>> list(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        NotificationDto.ListResult result = notificationService.getUserNotifications(CurrentUser.id(), page, size);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Đếm số lượng thông báo chưa đọc")
    public ResponseEntity<TransactionResponse<Map<String, Long>>> unreadCount(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        long count = notificationService.getUnreadCount(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu một thông báo là đã đọc")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> markAsRead(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        boolean success = notificationService.markAsRead(CurrentUser.id(), id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", success)));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc")
    public ResponseEntity<TransactionResponse<Map<String, Integer>>> markAllRead(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        int updated = notificationService.markAllAsRead(CurrentUser.id());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("updatedCount", updated)));
    }
}
