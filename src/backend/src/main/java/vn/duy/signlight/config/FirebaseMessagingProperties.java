package vn.duy.signlight.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "signlight.firebase")
public record FirebaseMessagingProperties(
        boolean enabled,
        String projectId,
        String serviceAccountJsonBase64,
        long workerDelayMs,
        int batchSize,
        int maxAttempts
) {
    public FirebaseMessagingProperties {
        workerDelayMs = workerDelayMs > 0 ? workerDelayMs : 5_000;
        batchSize = batchSize > 0 ? Math.min(batchSize, 200) : 50;
        maxAttempts = maxAttempts > 0 ? Math.min(maxAttempts, 10) : 5;
    }
}
