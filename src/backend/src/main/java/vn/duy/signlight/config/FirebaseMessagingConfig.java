package vn.duy.signlight.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@EnableConfigurationProperties(FirebaseMessagingProperties.class)
public class FirebaseMessagingConfig {

    @Bean(destroyMethod = "delete")
    @ConditionalOnProperty(prefix = "signlight.firebase", name = "enabled", havingValue = "true")
    FirebaseApp firebaseApp(FirebaseMessagingProperties properties) throws IOException {
        if (!StringUtils.hasText(properties.projectId())) {
            throw new IllegalStateException("FIREBASE_PROJECT_ID is required when Firebase is enabled");
        }

        FirebaseOptions options = FirebaseOptions.builder()
                .setProjectId(properties.projectId())
                .setCredentials(loadCredentials(properties.serviceAccountJsonBase64()))
                .build();
        return FirebaseApp.initializeApp(options, "signlight-fcm");
    }

    @Bean
    @ConditionalOnProperty(prefix = "signlight.firebase", name = "enabled", havingValue = "true")
    FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        return FirebaseMessaging.getInstance(firebaseApp);
    }

    private GoogleCredentials loadCredentials(String encodedServiceAccount) throws IOException {
        if (!StringUtils.hasText(encodedServiceAccount)) {
            return GoogleCredentials.getApplicationDefault();
        }
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(encodedServiceAccount.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is not valid Base64", ex);
        }
        try (ByteArrayInputStream input = new ByteArrayInputStream(decoded)) {
            return GoogleCredentials.fromStream(input);
        } finally {
            java.util.Arrays.fill(decoded, (byte) 0);
        }
    }
}
