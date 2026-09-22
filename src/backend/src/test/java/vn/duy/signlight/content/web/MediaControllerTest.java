package vn.duy.signlight.content.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.repository.SignVideoRepository;

class MediaControllerTest {

    private SignVideoRepository signVideoRepository;
    private MediaUrlService mediaUrlService;
    private MediaController mediaController;

    @BeforeEach
    void setUp() {
        signVideoRepository = mock(SignVideoRepository.class);
        mediaUrlService = mock(MediaUrlService.class);
        mediaController = new MediaController(signVideoRepository, mediaUrlService);
        ReflectionTestUtils.setField(mediaController, "webVideosDir", "src/main/resources/static/videos/web");
        ReflectionTestUtils.setField(mediaController, "rawVideosDir", "E:/EXE101/data/raw/VSL400/front_view");
    }

    @Test
    @DisplayName("streamVideo trả 404 khi không tìm thấy signVideoId")
    void returns404WhenNotFound() throws IOException {
        UUID id = UUID.randomUUID();
        when(signVideoRepository.findById(id)).thenReturn(Optional.empty());

        ResponseEntity<ResourceRegion> response = mediaController.streamVideo(id, new HttpHeaders());
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("streamVideo trả 307 redirect khi video có directUrl")
    void redirectsWhenDirectUrlPresent() throws IOException {
        UUID id = UUID.randomUUID();
        SignVideo video = SignVideo.builder()
                .id(id)
                .directUrl("https://example.com/video.mp4")
                .build();
        when(signVideoRepository.findById(id)).thenReturn(Optional.of(video));

        ResponseEntity<ResourceRegion> response = mediaController.streamVideo(id, new HttpHeaders());
        assertEquals(HttpStatus.TEMPORARY_REDIRECT, response.getStatusCode());
        assertEquals("https://example.com/video.mp4", response.getHeaders().getLocation().toString());
    }

    @Test
    @DisplayName("streamVideo trả 307 redirect tới Google Drive khi có driveFileId")
    void redirectsWhenDriveFileIdPresent() throws IOException {
        UUID id = UUID.randomUUID();
        SignVideo video = SignVideo.builder()
                .id(id)
                .driveFileId("drive123")
                .build();
        when(signVideoRepository.findById(id)).thenReturn(Optional.of(video));

        ResponseEntity<ResourceRegion> response = mediaController.streamVideo(id, new HttpHeaders());
        assertEquals(HttpStatus.TEMPORARY_REDIRECT, response.getStatusCode());
        assertEquals("https://drive.google.com/file/d/drive123/preview", response.getHeaders().getLocation().toString());
    }

    @Test
    @DisplayName("streamDriveFile trả redirect đúng link Google Drive")
    void streamDriveFileRedirects() {
        ResponseEntity<Void> response = mediaController.streamDriveFile("fileXYZ");
        assertEquals(HttpStatus.TEMPORARY_REDIRECT, response.getStatusCode());
        assertEquals("https://drive.google.com/file/d/fileXYZ/preview", response.getHeaders().getLocation().toString());
    }

    @Test
    @DisplayName("streamVideo phát hiện video web đóng gói và trả partial content 206")
    void streamsPackagedWebVideo() throws IOException {
        UUID id = UUID.randomUUID();
        SignVideo video = SignVideo.builder()
                .id(id)
                .objectKey("web/Anh__000000.mp4")
                .build();
        when(signVideoRepository.findById(id)).thenReturn(Optional.of(video));

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RANGE, "bytes=0-1024");

        ResponseEntity<ResourceRegion> response = mediaController.streamVideo(id, headers);
        assertEquals(HttpStatus.PARTIAL_CONTENT, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(0, response.getBody().getPosition());
        assertEquals(1025, response.getBody().getCount());
    }
}
