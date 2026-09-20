package vn.duy.signlight.content.application;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Dựng URL phát video có chữ ký, hạn 15 phút (BR-A17).
 *
 * <p>GĐ1 ký bằng HMAC ở phía ứng dụng và để reverse proxy/CDN kiểm tra. Khi chuyển sang object storage
 * thật thì thay hiện thực ở đây bằng presigned URL của nhà cung cấp — phần còn lại của hệ thống không
 * cần biết.
 */
@Service
public class MediaUrlService {

    private static final Duration TTL = Duration.ofMinutes(15);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String baseUrl;
    private final byte[] signingKey;

    public MediaUrlService(
            @Value("${signlight.media.base-url}") String baseUrl,
            @Value("${signlight.media.signing-key}") String signingKey) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.signingKey = signingKey.getBytes(StandardCharsets.UTF_8);
    }

    /** Trả {@code null} khi ký hiệu chưa có video — giao diện tự hiện khối thay thế. */
    public String signedUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        long expiresAt = Instant.now().plus(TTL).getEpochSecond();
        String signature = sign(objectKey + ":" + expiresAt);
        return baseUrl + "/" + objectKey + "?exp=" + expiresAt + "&sig=" + signature;
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(signingKey, HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("Không ký được URL media", ex);
        }
    }

    /** Dùng trong log/kiểm thử — không bao giờ in khoá ký. */
    public String keyFingerprint() {
        return HexFormat.of().formatHex(signingKey, 0, Math.min(4, signingKey.length));
    }
}
