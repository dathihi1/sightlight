package vn.duy.signlight.learning.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.airecognition.domain.SignAttempt;
import vn.duy.signlight.airecognition.repository.AiModelVersionRepository;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.LessonContentService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.LessonContentBlock;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.learning.domain.UserLessonSignPractice;
import vn.duy.signlight.learning.repository.UserLessonSignPracticeRepository;
import vn.duy.signlight.learning.web.dto.LessonPreparationResult;

/** Dựng và lưu chuỗi bài luyện từng từ đứng trước lesson chính. */
@Service
public class LessonPreparationService {

    private static final String COMPLETED = "COMPLETED";
    private static final String NOT_STARTED = "NOT_STARTED";

    private final ContentTreeService contentTree;
    private final LessonContentService lessonContentService;
    private final MediaUrlService mediaUrlService;
    private final UserLessonSignPracticeRepository practiceRepository;
    private final SignAttemptRepository attemptRepository;
    private final AiModelVersionRepository modelVersionRepository;

    public LessonPreparationService(
            ContentTreeService contentTree,
            LessonContentService lessonContentService,
            MediaUrlService mediaUrlService,
            UserLessonSignPracticeRepository practiceRepository,
            SignAttemptRepository attemptRepository,
            AiModelVersionRepository modelVersionRepository) {
        this.contentTree = contentTree;
        this.lessonContentService = lessonContentService;
        this.mediaUrlService = mediaUrlService;
        this.practiceRepository = practiceRepository;
        this.attemptRepository = attemptRepository;
        this.modelVersionRepository = modelVersionRepository;
    }

    @Transactional(readOnly = true)
    public LessonPreparationResult preparation(UUID userId, UUID lessonId) {
        Lesson lesson = contentTree.requirePublishedLesson(lessonId);
        List<Sign> requiredSigns = requiredSigns(lessonId);
        Set<UUID> completedIds = completedSignIds(userId, lessonId);
        Map<UUID, SignVideo> videos = contentTree.primaryVideos(
                requiredSigns.stream().map(Sign::getId).toList());

        List<LessonPreparationResult.Item> items = new ArrayList<>();
        for (int index = 0; index < requiredSigns.size(); index++) {
            Sign sign = requiredSigns.get(index);
            boolean completed = completedIds.contains(sign.getId());
            SignVideo video = videos.get(sign.getId());
            items.add(new LessonPreparationResult.Item(
                    sign.getId(),
                    sign.getWord(),
                    meaningOf(sign),
                    video == null ? null : mediaUrlService.resolveVideoUrl(video),
                    video != null && video.getObjectKey() != null
                            && video.getObjectKey().startsWith("seed/"),
                    completed ? COMPLETED : NOT_STARTED,
                    false,
                    index));
        }

        return new LessonPreparationResult(
                lessonId,
                lesson.getTitle(),
                requiredSigns.isEmpty() || completedIds.containsAll(
                        requiredSigns.stream().map(Sign::getId).toList()),
                items);
    }

    @Transactional(readOnly = true)
    public boolean allCompleted(UUID userId, UUID lessonId) {
        List<Sign> signs = requiredSigns(lessonId);
        if (signs.isEmpty()) {
            return true;
        }
        Set<UUID> completedIds = completedSignIds(userId, lessonId);
        return signs.stream().allMatch(sign -> completedIds.contains(sign.getId()));
    }

    @Transactional
    public LessonPreparationResult complete(
            UUID userId, UUID lessonId, UUID signId, UUID attemptId) {
        contentTree.requirePublishedLesson(lessonId);
        List<Sign> requiredSigns = requiredSigns(lessonId);
        int signIndex = -1;
        for (int index = 0; index < requiredSigns.size(); index++) {
            if (requiredSigns.get(index).getId().equals(signId)) {
                signIndex = index;
                break;
            }
        }
        if (signIndex < 0) {
            throw new BusinessException(ErrorCode.SIGN_PRACTICE_INVALID);
        }

        SignAttempt attempt = attemptRepository.findById(attemptId)
                .filter(item -> item.getUserId().equals(userId))
                .filter(item -> item.getTargetSignId().equals(signId))
                .orElseThrow(() -> new BusinessException(ErrorCode.SIGN_PRACTICE_INVALID));
        if (!attempt.isVerified() && !isStubAttempt(attempt)) {
            throw new BusinessException(ErrorCode.SIGN_PRACTICE_INVALID);
        }

        if (!practiceRepository.existsByUserIdAndLessonIdAndSignId(userId, lessonId, signId)) {
            practiceRepository.save(UserLessonSignPractice.builder()
                    .userId(userId)
                    .lessonId(lessonId)
                    .signId(signId)
                    .attemptId(attemptId)
                    .completedAt(Instant.now())
                    .build());
        }
        return preparation(userId, lessonId);
    }

    /** Từ được khai báo bằng SIGN_CARD; nếu chưa khai báo thì lấy theo thứ tự xuất hiện trong exercise. */
    @Transactional(readOnly = true)
    public List<Sign> requiredSigns(UUID lessonId) {
        LinkedHashSet<UUID> signIds = lessonContentService.getPublishedBlocks(lessonId).stream()
                .filter(block -> "SIGN_CARD".equals(block.getBlockType()))
                .map(LessonContentBlock::getSignId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (signIds.isEmpty()) {
            contentTree.exercisesOf(lessonId).stream()
                    .map(vn.duy.signlight.content.domain.Exercise::getSignId)
                    .filter(java.util.Objects::nonNull)
                    .forEach(signIds::add);
        }

        Map<UUID, Sign> signsById = contentTree.publishedSigns(signIds).stream()
                .collect(Collectors.toMap(Sign::getId, Function.identity()));
        return signIds.stream().map(signsById::get).filter(java.util.Objects::nonNull).toList();
    }

    private Set<UUID> completedSignIds(UUID userId, UUID lessonId) {
        if (userId == null) {
            return Set.of();
        }
        return practiceRepository.findByUserIdAndLessonId(userId, lessonId).stream()
                .map(UserLessonSignPractice::getSignId)
                .collect(Collectors.toSet());
    }

    private boolean isStubAttempt(SignAttempt attempt) {
        return modelVersionRepository.findById(attempt.getModelVersionId())
                .map(version -> version.getVersionCode().endsWith("-stub"))
                .orElse(false);
    }

    private String meaningOf(Sign sign) {
        if (sign.getMeaning() != null && !sign.getMeaning().isBlank()) {
            return sign.getMeaning();
        }
        if (sign.getDescription() != null && !sign.getDescription().isBlank()) {
            return sign.getDescription();
        }
        return "Ký hiệu: " + sign.getWord();
    }
}
