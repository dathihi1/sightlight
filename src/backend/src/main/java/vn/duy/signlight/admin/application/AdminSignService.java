package vn.duy.signlight.admin.application;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.admin.web.dto.AdminSignDtos;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Course;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.repository.CourseRepository;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;

@Service
public class AdminSignService {

    private static final Logger log = LoggerFactory.getLogger(AdminSignService.class);

    private final SignRepository signRepository;
    private final SignVideoRepository signVideoRepository;
    private final CourseRepository courseRepository;
    private final MediaUrlService mediaUrlService;

    public AdminSignService(
            SignRepository signRepository,
            SignVideoRepository signVideoRepository,
            CourseRepository courseRepository,
            MediaUrlService mediaUrlService) {
        this.signRepository = signRepository;
        this.signVideoRepository = signVideoRepository;
        this.courseRepository = courseRepository;
        this.mediaUrlService = mediaUrlService;
    }

    @Transactional(readOnly = true)
    public AdminSignDtos.AdminSignListResponse getSignList(String search, String topic, int page, int size) {
        int boundedSize = Math.max(1, Math.min(size, 100));
        int boundedPage = Math.max(0, page);

        String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String trimmedTopic = (topic != null && !topic.trim().isEmpty()) ? topic.trim() : null;

        Page<Sign> signPage = signRepository.adminSearch(trimmedSearch, trimmedTopic, PageRequest.of(boundedPage, boundedSize));

        List<UUID> signIds = signPage.getContent().stream().map(Sign::getId).toList();
        List<SignVideo> videos = signIds.isEmpty()
                ? List.of()
                : signVideoRepository.findBySignIdInOrderByPrimaryVariantDesc(signIds);

        Map<UUID, SignVideo> primaryVideoMap = videos.stream()
                .filter(SignVideo::isPrimaryVariant)
                .collect(Collectors.toMap(SignVideo::getSignId, Function.identity(), (a, b) -> a));

        List<AdminSignDtos.AdminSignItemDto> items = signPage.getContent().stream().map(sign -> {
            SignVideo video = primaryVideoMap.get(sign.getId());
            if (video == null && !videos.isEmpty()) {
                video = videos.stream().filter(v -> v.getSignId().equals(sign.getId())).findFirst().orElse(null);
            }
            String videoUrl = video != null ? mediaUrlService.resolveVideoUrl(video) : null;

            return new AdminSignDtos.AdminSignItemDto(
                    sign.getId(),
                    sign.getWord(),
                    sign.getMeaning(),
                    sign.getTopic(),
                    sign.getWordClass(),
                    sign.getCefrLevel(),
                    sign.getDescription(),
                    sign.getStatus(),
                    video != null ? video.getId() : null,
                    videoUrl,
                    video != null ? video.getDirectUrl() : null,
                    video != null ? video.getDriveFileId() : null,
                    video != null ? video.getStorageProvider() : null,
                    video != null ? video.getRegionLabel() : null,
                    video != null ? video.getSignerLabel() : null,
                    video != null ? video.getDurationMs() : null
            );
        }).toList();

        return new AdminSignDtos.AdminSignListResponse(
                items,
                signPage.getTotalPages(),
                signPage.getTotalElements(),
                boundedPage
        );
    }

    @Transactional(readOnly = true)
    public AdminSignDtos.AdminSignItemDto getSignDetail(UUID signId) {
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        List<SignVideo> videos = signVideoRepository.findBySignId(signId);
        SignVideo primary = videos.stream().filter(SignVideo::isPrimaryVariant).findFirst()
                .orElse(videos.isEmpty() ? null : videos.get(0));

        String videoUrl = primary != null ? mediaUrlService.resolveVideoUrl(primary) : null;

        return new AdminSignDtos.AdminSignItemDto(
                sign.getId(),
                sign.getWord(),
                sign.getMeaning(),
                sign.getTopic(),
                sign.getWordClass(),
                sign.getCefrLevel(),
                sign.getDescription(),
                sign.getStatus(),
                primary != null ? primary.getId() : null,
                videoUrl,
                primary != null ? primary.getDirectUrl() : null,
                primary != null ? primary.getDriveFileId() : null,
                primary != null ? primary.getStorageProvider() : null,
                primary != null ? primary.getRegionLabel() : null,
                primary != null ? primary.getSignerLabel() : null,
                primary != null ? primary.getDurationMs() : null
        );
    }

    @Transactional
    public UUID createSign(AdminSignDtos.AdminSignUpsertRequest req) {
        if (req.word() == null || req.word().trim().isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        Course course = courseRepository.findByCode("VSL")
                .orElseGet(() -> courseRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND)));

        UUID signId = UUID.randomUUID();
        Sign sign = Sign.builder()
                .id(signId)
                .courseId(course.getId())
                .word(req.word().trim())
                .meaning(req.meaning() != null ? req.meaning().trim() : "")
                .topic(req.topic() != null ? req.topic().trim() : "Chung")
                .wordClass(req.wordClass() != null ? req.wordClass().trim() : "NOUN")
                .cefrLevel(req.cefrLevel() != null ? req.cefrLevel().trim() : "A1")
                .description(req.description() != null ? req.description().trim() : null)
                .status(req.status() != null ? req.status().trim() : "PUBLISHED")
                .seed(false)
                .build();
        signRepository.save(sign);

        if ((req.directUrl() != null && !req.directUrl().isBlank())
                || (req.driveFileId() != null && !req.driveFileId().isBlank())) {
            SignVideo video = SignVideo.builder()
                    .id(UUID.randomUUID())
                    .signId(signId)
                    .directUrl(req.directUrl() != null ? req.directUrl().trim() : null)
                    .driveFileId(req.driveFileId() != null ? req.driveFileId().trim() : null)
                    .storageProvider("GDRIVE")
                    .regionLabel(req.regionLabel() != null ? req.regionLabel().trim() : "Toàn quốc")
                    .signerLabel(req.signerLabel() != null ? req.signerLabel().trim() : "Giảng viên VSL")
                    .primaryVariant(true)
                    .status("READY")
                    .seed(false)
                    .durationMs(3000)
                    .build();
            signVideoRepository.save(video);
        }

        log.info("admin_sign_created sign_id={} word={}", signId, req.word());
        return signId;
    }

    @Transactional
    public void updateSign(UUID signId, AdminSignDtos.AdminSignUpsertRequest req) {
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (req.word() != null && !req.word().trim().isEmpty()) {
            sign.setWord(req.word().trim());
        }
        if (req.meaning() != null) {
            sign.setMeaning(req.meaning().trim());
        }
        if (req.topic() != null) {
            sign.setTopic(req.topic().trim());
        }
        if (req.wordClass() != null) {
            sign.setWordClass(req.wordClass().trim());
        }
        if (req.cefrLevel() != null) {
            sign.setCefrLevel(req.cefrLevel().trim());
        }
        if (req.description() != null) {
            sign.setDescription(req.description().trim());
        }
        if (req.status() != null) {
            sign.setStatus(req.status().trim());
        }
        signRepository.save(sign);

        // Update or create primary video
        List<SignVideo> videos = signVideoRepository.findBySignId(signId);
        SignVideo primary = videos.stream().filter(SignVideo::isPrimaryVariant).findFirst().orElse(null);

        if (primary == null && ((req.directUrl() != null && !req.directUrl().isBlank())
                || (req.driveFileId() != null && !req.driveFileId().isBlank()))) {
            primary = SignVideo.builder()
                    .id(UUID.randomUUID())
                    .signId(signId)
                    .storageProvider("GDRIVE")
                    .primaryVariant(true)
                    .status("READY")
                    .seed(false)
                    .build();
        }

        if (primary != null) {
            if (req.directUrl() != null) {
                primary.setDirectUrl(req.directUrl().trim());
            }
            if (req.driveFileId() != null) {
                primary.setDriveFileId(req.driveFileId().trim());
            }
            if (req.regionLabel() != null) {
                primary.setRegionLabel(req.regionLabel().trim());
            }
            if (req.signerLabel() != null) {
                primary.setSignerLabel(req.signerLabel().trim());
            }
            signVideoRepository.save(primary);
        }

        log.info("admin_sign_updated sign_id={}", signId);
    }

    @Transactional
    public void deleteSign(UUID signId) {
        Sign sign = signRepository.findById(signId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        List<SignVideo> videos = signVideoRepository.findBySignId(signId);
        if (!videos.isEmpty()) {
            signVideoRepository.deleteAll(videos);
        }
        signRepository.delete(sign);
        log.info("admin_sign_deleted sign_id={}", signId);
    }

    @Transactional(readOnly = true)
    public List<String> getTopics() {
        return signRepository.findAllDistinctTopics();
    }
}
