package vn.duy.signlight.notification.application;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import vn.duy.signlight.notification.domain.PushOutbox;

@Service
@ConditionalOnProperty(prefix = "signlight.firebase", name = "enabled", havingValue = "true")
public class FirebasePushGateway implements PushGateway {

    private final FirebaseMessaging firebaseMessaging;

    public FirebasePushGateway(FirebaseMessaging firebaseMessaging) {
        this.firebaseMessaging = firebaseMessaging;
    }

    @Override
    public String send(String firebaseInstallationId, PushOutbox delivery) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("schemaVersion", "1");
        data.put("notificationId", delivery.getNotificationId().toString());
        data.put("type", delivery.getNotificationType());
        data.put("title", delivery.getTitle());
        data.put("body", delivery.getBody());
        data.put("targetUrl", safeTargetUrl(delivery.getTargetUrl()));

        Message message = Message.builder()
                .setFid(firebaseInstallationId)
                .setNotification(com.google.firebase.messaging.Notification.builder()
                        .setTitle(delivery.getTitle())
                        .setBody(delivery.getBody())
                        .build())
                .putAllData(data)
                .build();
        try {
            return firebaseMessaging.send(message);
        } catch (FirebaseMessagingException ex) {
            MessagingErrorCode messagingCode = ex.getMessagingErrorCode();
            String errorCode = messagingCode != null ? messagingCode.name() : "FIREBASE_SEND_FAILED";
            boolean invalidInstallation = messagingCode == MessagingErrorCode.UNREGISTERED;
            throw new PushDeliveryException(errorCode, invalidInstallation, ex);
        }
    }

    private String safeTargetUrl(String targetUrl) {
        if (targetUrl == null
                || !targetUrl.startsWith("/")
                || targetUrl.startsWith("//")
                || targetUrl.contains("\\")) {
            return "/thong-bao";
        }
        return targetUrl;
    }
}
