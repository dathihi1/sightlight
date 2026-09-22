package vn.duy.signlight.content.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.content.domain.SignVideo;

class MediaUrlServiceTest {

    private MediaUrlService mediaUrlService;

    @BeforeEach
    void setUp() {
        mediaUrlService = new MediaUrlService(
                "http://localhost:18080", "test-secret-key-at-least-32-chars-long!", "");
    }

    @Test
    @DisplayName("resolveVideoUrl trả null khi video là null")
    void returnsNullWhenVideoIsNull() {
        assertNull(mediaUrlService.resolveVideoUrl(null));
    }

    @Test
    @DisplayName("resolveVideoUrl ưu tiên video web cục bộ hơn directUrl và driveFileId khi chưa cấu hình R2")
    void prefersLocalWebObjectKey() {
        UUID videoId = UUID.randomUUID();
        SignVideo video = SignVideo.builder()
                .id(videoId)
                .directUrl("https://drive.google.com/file/d/1abcXYZ/view")
                .driveFileId("1abcXYZ")
                .objectKey("web/Anh__000000.mp4")
                .build();

        assertEquals("http://localhost:18080/api/v1/media/stream/" + videoId,
                mediaUrlService.resolveVideoUrl(video));
    }

    @Test
    @DisplayName("resolveVideoUrl trả link R2 công khai (đã mã hoá) cho video web khi cấu hình R2 base URL")
    void returnsR2PublicUrlForWebObjectKey() {
        MediaUrlService r2Service = new MediaUrlService(
                "http://localhost:18080",
                "test-secret-key-at-least-32-chars-long!",
                "https://pub-abc123.r2.dev/");
        SignVideo video = SignVideo.builder()
                .id(UUID.randomUUID())
                .driveFileId("1abcXYZ")
                .objectKey("web/Quạt (đứng)__000038.mp4")
                .build();

        String url = r2Service.resolveVideoUrl(video);
        // Giữ nguyên dấu / phân đoạn, mã hoá phần còn lại: không còn dấu cách/ngoặc thô.
        assertTrue(url.startsWith("https://pub-abc123.r2.dev/web/"));
        assertTrue(url.endsWith("__000038.mp4"));
        assertFalse(url.contains(" "));
        assertFalse(url.contains("("));
        assertFalse(url.contains("+"));
    }

    @Test
    @DisplayName("resolveVideoUrl ưu tiên directUrl nếu có (không phải video web cục bộ)")
    void prefersDirectUrl() {
        SignVideo video = SignVideo.builder()
                .id(UUID.randomUUID())
                .directUrl("https://cdn.example.com/video.mp4")
                .objectKey("raw/test.mp4")
                .build();

        assertEquals("https://cdn.example.com/video.mp4", mediaUrlService.resolveVideoUrl(video));
    }

    @Test
    @DisplayName("resolveVideoUrl sử dụng Google Drive URL khi có driveFileId")
    void usesDriveFileId() {
        SignVideo video = SignVideo.builder()
                .id(UUID.randomUUID())
                .driveFileId("1abcXYZ")
                .objectKey("raw/test.mp4")
                .build();

        assertEquals("https://drive.google.com/file/d/1abcXYZ/preview", mediaUrlService.resolveVideoUrl(video));
    }

    @Test
    @DisplayName("resolveVideoUrl trả null đối với placeholder video seed/placeholder/...")
    void returnsNullForPlaceholderVideo() {
        SignVideo video = SignVideo.builder()
                .id(UUID.randomUUID())
                .objectKey("seed/placeholder/uuid.mp4")
                .build();

        assertNull(mediaUrlService.resolveVideoUrl(video));
    }

    @Test
    @DisplayName("resolveVideoUrl trả endpoint backend stream khi có objectKey hợp lệ")
    void returnsStreamEndpointForValidObjectKey() {
        UUID videoId = UUID.randomUUID();
        SignVideo video = SignVideo.builder()
                .id(videoId)
                .objectKey("web/Anh__000000.mp4")
                .build();

        String url = mediaUrlService.resolveVideoUrl(video);
        assertEquals("http://localhost:18080/api/v1/media/stream/" + videoId, url);
    }

    @Test
    @DisplayName("signedUrl tạo link kèm exp và sig")
    void createsSignedUrl() {
        String signed = mediaUrlService.signedUrl("raw/video.mp4");
        assertTrue(signed.startsWith("http://localhost:18080/raw/video.mp4?exp="));
        assertTrue(signed.contains("&sig="));
    }
}
