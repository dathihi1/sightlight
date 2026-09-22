package vn.duy.signlight.content.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.repository.SignVideoRepository;

/**
 * Điều hướng và phát luồng video ký hiệu (hỗ trợ HTTP Range requests / Byte Ranges).
 *
 * <p>CSDL chỉ lưu trữ thông tin, mã nhận diện và liên kết của video.
 * Controller này điều hướng tới directUrl / Google Drive hoặc phát luồng từ tệp web tĩnh.
 */
@RestController
@RequestMapping("/api/v1/media")
@Tag(name = "media")
public class MediaController {

    private static final Logger log = LoggerFactory.getLogger(MediaController.class);

    private final SignVideoRepository signVideoRepository;
    private final MediaUrlService mediaUrlService;

    @Value("${signlight.media.web-videos-dir:src/backend/src/main/resources/static/videos/web}")
    private String webVideosDir;

    @Value("${signlight.media.raw-videos-dir:E:/EXE101/data/raw/VSL400/front_view}")
    private String rawVideosDir;

    public MediaController(
            SignVideoRepository signVideoRepository,
            MediaUrlService mediaUrlService) {
        this.signVideoRepository = signVideoRepository;
        this.mediaUrlService = mediaUrlService;
    }

    @GetMapping("/stream/{signVideoId}")
    @Operation(summary = "Phát luồng video ký hiệu (hỗ trợ HTTP Range request)")
    public ResponseEntity<ResourceRegion> streamVideo(
            @PathVariable UUID signVideoId,
            @RequestHeader(required = false) HttpHeaders headers) throws IOException {
        SignVideo video = signVideoRepository.findById(signVideoId).orElse(null);
        if (video == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // 1. Ưu tiên nạp từ tập tin cục bộ nếu hệ thống có tệp (phát luồng byte-range trực tiếp)
        Resource resource = resolveResource(video);
        if (resource != null && resource.exists() && resource.isReadable()) {
            return buildResourceRegionResponse(resource, resource.contentLength(), "video/mp4", headers);
        }

        // 2. Chuyển tiếp directUrl nếu có
        if (video.getDirectUrl() != null && !video.getDirectUrl().isBlank()) {
            return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
                    .location(URI.create(video.getDirectUrl()))
                    .build();
        }

        // 3. Chuyển tiếp Google Drive preview nếu có driveFileId
        if (video.getDriveFileId() != null && !video.getDriveFileId().isBlank()) {
            return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
                    .location(URI.create("https://drive.google.com/file/d/" + video.getDriveFileId() + "/preview"))
                    .build();
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping("/drive/{driveFileId}")
    @Operation(summary = "Phát video trực tiếp theo mã tệp Google Drive")
    public ResponseEntity<Void> streamDriveFile(@PathVariable String driveFileId) {
        String targetUrl = "https://drive.google.com/file/d/" + driveFileId + "/preview";
        return ResponseEntity.status(HttpStatus.TEMPORARY_REDIRECT)
                .location(URI.create(targetUrl))
                .build();
    }

    private ResponseEntity<ResourceRegion> buildResourceRegionResponse(
            Resource resource,
            long contentLength,
            String contentType,
            HttpHeaders headers) throws IOException {
        List<HttpRange> ranges = headers != null ? headers.getRange() : List.of();

        if (ranges.isEmpty()) {
            ResourceRegion region = new ResourceRegion(resource, 0, contentLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(MediaType.valueOf(contentType))
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(region);
        }

        HttpRange range = ranges.get(0);
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);

        if (start >= contentLength) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + contentLength)
                    .build();
        }

        long rangeLength = Math.min(1024 * 1024L, end - start + 1);
        ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.valueOf(contentType))
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(region);
    }

    private Resource resolveResource(SignVideo video) {
        String key = video.getObjectKey();
        if (key == null || key.isBlank() || key.startsWith("seed/placeholder/")) {
            return null;
        }
        try {
            if (key.startsWith("web/")) {
                String filename = key.substring(4);
                Path path = Paths.get(webVideosDir, filename);
                if (Files.exists(path) && Files.isReadable(path)) {
                    return new FileSystemResource(path);
                }
                ClassPathResource classPathResource = new ClassPathResource("static/videos/" + key);
                if (classPathResource.exists() && classPathResource.isReadable()) {
                    return classPathResource;
                }
                ClassPathResource webResource = new ClassPathResource("static/videos/web/" + filename);
                if (webResource.exists() && webResource.isReadable()) {
                    return webResource;
                }
            } else if (key.startsWith("raw/")) {
                String filename = key.substring(4);
                Path path = Paths.get(rawVideosDir, filename);
                if (Files.exists(path) && Files.isReadable(path)) {
                    return new FileSystemResource(path);
                }
                if (video.getId() != null) {
                    Path vidPath = Paths.get(rawVideosDir, video.getId().toString() + ".mp4");
                    if (Files.exists(vidPath) && Files.isReadable(vidPath)) {
                        return new FileSystemResource(vidPath);
                    }
                }
            } else {
                Path rawPath = Paths.get(rawVideosDir, key);
                if (Files.exists(rawPath) && Files.isReadable(rawPath)) {
                    return new FileSystemResource(rawPath);
                }
                if (video.getId() != null) {
                    Path vidPath = Paths.get(rawVideosDir, video.getId().toString() + ".mp4");
                    if (Files.exists(vidPath) && Files.isReadable(vidPath)) {
                        return new FileSystemResource(vidPath);
                    }
                }
                Path webPath = Paths.get(webVideosDir, key);
                if (Files.exists(webPath) && Files.isReadable(webPath)) {
                    return new FileSystemResource(webPath);
                }
            }
        } catch (Exception ex) {
            log.warn("resolve_video_resource_failed videoId={} key={} error={}", video.getId(), key, ex.getMessage());
        }
        return null;
    }
}
