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
import vn.duy.signlight.content.domain.SignVideo;

/**
 * Dựng URL phát video có chữ ký hoặc phân giải liên kết phát qua Google Drive.
 *
 * <p>Hỗ trợ Google Drive streaming URL (lh3 CDN hỗ trợ HTML5 video player và Range header)
 * và ký HMAC cho các luồng lưu trữ đối tượng.
 */
@Service
public class MediaUrlService {

    private static final Duration TTL = Duration.ofMinutes(15);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String baseUrl;
    private final String r2PublicBaseUrl;
    private final byte[] signingKey;

    public MediaUrlService(
            @Value("${signlight.media.base-url}") String baseUrl,
            @Value("${signlight.media.signing-key}") String signingKey,
            @Value("${signlight.media.r2-public-base-url:}") String r2PublicBaseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.signingKey = signingKey.getBytes(StandardCharsets.UTF_8);
        String trimmed = r2PublicBaseUrl == null ? "" : r2PublicBaseUrl.trim();
        this.r2PublicBaseUrl = trimmed.endsWith("/")
                ? trimmed.substring(0, trimmed.length() - 1)
                : trimmed;
    }

    /**
     * Phân giải URL video từ thực thể {@link SignVideo}.
     * Thứ tự: directUrl -> driveFileId (preview) -> backend stream endpoint theo objectKey / id.
     */
    public String resolveVideoUrl(SignVideo video) {
        if (video == null) {
            return null;
        }
        if (video.getObjectKey() != null && video.getObjectKey().startsWith("seed/placeholder/")) {
            return null;
        }
        // Ưu tiên tuyệt đối video web (web/*.mp4). Nếu có cấu hình R2 public base URL thì trả
        // thẳng link công khai của bucket R2 (FE tải trực tiếp); nếu không thì phát luồng qua backend.
        if (video.getObjectKey() != null && video.getObjectKey().startsWith("web/")) {
            if (!r2PublicBaseUrl.isEmpty()) {
                return r2PublicBaseUrl + "/" + encodePath(video.getObjectKey());
            }
            return baseUrl + "/api/v1/media/stream/" + video.getId();
        }
        if (video.getDirectUrl() != null && !video.getDirectUrl().isBlank()) {
            String direct = video.getDirectUrl();
            if (direct.contains("drive.google.com") || direct.contains("drive.usercontent.google.com")) {
                String extractedId = extractDriveId(direct);
                if (extractedId != null) {
                    return "https://drive.google.com/file/d/" + extractedId + "/preview";
                }
            }
            return direct;
        }
        if (video.getDriveFileId() != null && !video.getDriveFileId().isBlank()) {
            return "https://drive.google.com/file/d/" + video.getDriveFileId() + "/preview";
        }
        if (video.getObjectKey() != null && !video.getObjectKey().isBlank()) {
            return baseUrl + "/api/v1/media/stream/" + video.getId();
        }
        return baseUrl + "/api/v1/media/stream/" + video.getId();
    }

    /** Mã hoá từng đoạn path cho URL R2 (tên file có dấu tiếng Việt, dấu cách, ngoặc). */
    private String encodePath(String objectKey) {
        String[] segments = objectKey.split("/");
        StringBuilder encoded = new StringBuilder();
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                encoded.append('/');
            }
            encoded.append(java.net.URLEncoder.encode(segments[i], StandardCharsets.UTF_8)
                    .replace("+", "%20"));
        }
        return encoded.toString();
    }

    private String extractDriveId(String url) {
        if (url == null) {
            return null;
        }
        java.util.regex.Matcher m1 = java.util.regex.Pattern.compile("/file/d/([a-zA-Z0-9_-]+)").matcher(url);
        if (m1.find()) {
            return m1.group(1);
        }
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("[?&]id=([a-zA-Z0-9_-]+)").matcher(url);
        if (m2.find()) {
            return m2.group(1);
        }
        return null;
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
