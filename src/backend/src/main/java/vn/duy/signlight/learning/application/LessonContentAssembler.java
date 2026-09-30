package vn.duy.signlight.learning.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.LessonContentBlock;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.learning.web.dto.ContentBlockNode;
import vn.duy.signlight.learning.web.dto.LessonResult;

/**
 * Service dựng nội dung bài học thành DTO public.
 *
 * <p>Trách nhiệm:
 * <ul>
 *   <li>Load lesson, exercises, options, videos, blocks</li>
 *   <li>Transform thành DTO public</li>
 *   <li>Shuffle tokens cho SENTENCE_ORDER</li>
 *   <li>Đảm bảo không lộ đáp án</li>
 * </ul>
 *
 * <p><b>Security:</b> Không bao giờ trả correctAnswerText, correctOrder, isCorrect trong public DTO.
 */
@Service
@Transactional(readOnly = true)
public class LessonContentAssembler {

    private static final Logger log = LoggerFactory.getLogger(LessonContentAssembler.class);
    private static final String TYPE_SENTENCE_ORDER = "SENTENCE_ORDER";

    private final ContentTreeService contentTree;
    private final MediaUrlService mediaUrlService;
    private final vn.duy.signlight.content.application.LessonContentService lessonContentService;
    private final ObjectMapper objectMapper;

    public LessonContentAssembler(
            ContentTreeService contentTree,
            MediaUrlService mediaUrlService,
            vn.duy.signlight.content.application.LessonContentService lessonContentService,
            ObjectMapper objectMapper) {
        this.contentTree = contentTree;
        this.mediaUrlService = mediaUrlService;
        this.lessonContentService = lessonContentService;
        this.objectMapper = objectMapper;
    }

    /**
     * Dựng LessonResult DTO từ lesson ID.
     *
     * @param lessonId ID bài học
     * @param resumeAtIndex vị trí resume
     * @return LessonResult DTO không chứa đáp án
     */
    public LessonResult assembleLessonResult(UUID lessonId, int resumeAtIndex) {
        Lesson lesson = contentTree.requirePublishedLesson(lessonId);

        // Load exercises
        List<Exercise> exercises = contentTree.exercisesOf(lessonId);

        // Load options
        Map<UUID, List<ExerciseOption>> optionsByExercise = contentTree.optionsOf(
                exercises.stream().map(Exercise::getId).toList());

        // Load videos
        Map<UUID, SignVideo> videos = contentTree.primaryVideos(
                exercises.stream()
                        .map(Exercise::getSignId)
                        .filter(java.util.Objects::nonNull)
                        .toList());

        // Build exercise nodes
        List<LessonResult.ExerciseNode> nodes = new ArrayList<>();
        for (Exercise exercise : exercises) {
            SignVideo video = exercise.getSignId() == null ? null : videos.get(exercise.getSignId());
            List<LessonResult.OptionNode> options = optionsByExercise
                    .getOrDefault(exercise.getId(), List.of()).stream()
                    // Cố ý chỉ lấy id + nhãn: isCorrect không bao giờ rời khỏi server
                    .map(option -> new LessonResult.OptionNode(
                            option.getId(), option.getLabelText(), null))
                    .toList();

            nodes.add(new LessonResult.ExerciseNode(
                    exercise.getId(),
                    exercise.getStableKey(),
                    exercise.getType(),
                    exercise.getSkill(),
                    exercise.getDifficulty(),
                    exercise.getInstructionText(),
                    exercise.getPromptText(),
                    video == null ? null : mediaUrlService.resolveVideoUrl(video),
                    video != null && video.getObjectKey() != null && video.getObjectKey().startsWith("seed/"),
                    options,
                    shuffledTokens(exercise)));
        }

        // Load content blocks
        List<LessonContentBlock> rawBlocks = lessonContentService.getPublishedBlocks(lessonId);
        Map<UUID, SignVideo> blockVideos = contentTree.primaryVideos(
                rawBlocks.stream()
                        .map(LessonContentBlock::getSignId)
                        .filter(java.util.Objects::nonNull)
                        .toList());

        List<ContentBlockNode> blocks = new ArrayList<>(rawBlocks.stream()
                .map(b -> toContentBlockNode(b, blockVideos))
                .toList());

        // Bổ sung các thẻ học từ mới (SIGN_CARD) nếu bài học chưa có cấu hình block tĩnh
        boolean hasSignCards = blocks.stream().anyMatch(b -> "SIGN_CARD".equals(b.blockType()));
        if (!hasSignCards && !exercises.isEmpty()) {
            List<UUID> exerciseSignIds = exercises.stream()
                    .map(Exercise::getSignId)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .toList();

            if (!exerciseSignIds.isEmpty()) {
                List<vn.duy.signlight.content.domain.Sign> signs = contentTree.publishedSigns(exerciseSignIds);
                Map<UUID, vn.duy.signlight.content.domain.Sign> signMap = signs.stream()
                        .collect(java.util.stream.Collectors.toMap(
                                vn.duy.signlight.content.domain.Sign::getId,
                                s -> s,
                                (s1, s2) -> s1));

                List<ContentBlockNode> synthesizedCards = new ArrayList<>();
                for (UUID signId : exerciseSignIds) {
                    vn.duy.signlight.content.domain.Sign sign = signMap.get(signId);
                    if (sign == null) {
                        continue;
                    }
                    SignVideo video = videos.get(signId);
                    String mediaUrl = video == null ? null : mediaUrlService.resolveVideoUrl(video);

                    String meaningText = sign.getMeaning();
                    if (meaningText == null || meaningText.isBlank()) {
                        meaningText = sign.getDescription();
                    }
                    if (meaningText == null || meaningText.isBlank()) {
                        meaningText = "Ký hiệu: " + sign.getWord();
                    }

                    Map<String, Object> payload = new java.util.LinkedHashMap<>();
                    if (sign.getWordClass() != null) {
                        payload.put("wordClass", sign.getWordClass());
                    }
                    if (sign.getTopic() != null) {
                        payload.put("topic", sign.getTopic());
                    }
                    if (sign.getCefrLevel() != null) {
                        payload.put("cefrLevel", sign.getCefrLevel());
                    }

                    synthesizedCards.add(new ContentBlockNode(
                            sign.getId(),
                            "sign-card-" + sign.getId(),
                            "SIGN_CARD",
                            sign.getWord(),
                            meaningText,
                            payload,
                            sign.getId(),
                            mediaUrl,
                            true));
                }

                // Chèn các thẻ SIGN_CARD vào blocks: giữ INTRO lên đầu (nếu có), sau đó tới SIGN_CARD
                List<ContentBlockNode> mergedBlocks = new ArrayList<>();
                blocks.stream().filter(b -> "INTRO".equals(b.blockType())).forEach(mergedBlocks::add);
                mergedBlocks.addAll(synthesizedCards);
                blocks.stream().filter(b -> !"INTRO".equals(b.blockType())).forEach(mergedBlocks::add);
                blocks = mergedBlocks;
            }
        }

        // Build result
        return new LessonResult(
                lesson.getId(),
                lesson.getStableKey(),
                lesson.getTitle(),
                lesson.getSummary(),
                lesson.getType(),
                lesson.getTopic(),
                lesson.getTargetLevel(),
                lesson.getEstimatedMinutes(),
                lesson.getContentVersion(),
                List.of(), // learningObjectives - can be extracted from blocks
                blocks,
                resumeAtIndex,
                nodes);
    }

    /**
     * Shuffle tokens cho SENTENCE_ORDER.
     *
     * <p>Xáo bằng seed cố định theo exercise ID để người học vào lại thấy cùng thứ tự.
     */
    private List<String> shuffledTokens(Exercise exercise) {
        if (!TYPE_SENTENCE_ORDER.equals(exercise.getType()) || exercise.getCorrectOrder() == null) {
            return null;
        }

        List<String> tokens = new ArrayList<>(readStringList(exercise.getCorrectOrder()));
        java.util.Collections.shuffle(tokens,
                new Random(exercise.getId().getMostSignificantBits()));
        return tokens;
    }

    /**
     * Transform LessonContentBlock entity sang DTO.
     */
    private ContentBlockNode toContentBlockNode(LessonContentBlock block, Map<UUID, SignVideo> blockVideos) {
        String mediaUrl = block.getMediaRef();
        if ((mediaUrl == null || mediaUrl.isBlank()) && block.getSignId() != null) {
            SignVideo video = blockVideos.get(block.getSignId());
            if (video != null) {
                mediaUrl = mediaUrlService.resolveVideoUrl(video);
            }
        }
        return new ContentBlockNode(
                block.getId(),
                block.getStableKey(),
                block.getBlockType(),
                block.getTitle(),
                block.getBodyText(),
                parseJsonPayload(block.getPayload()),
                block.getSignId(),
                mediaUrl,
                block.isRequired());
    }

    /**
     * Parse JSON payload an toàn.
     */
    private Object parseJsonPayload(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            log.warn("Failed to parse content block payload", e);
            return null;
        }
    }

    /**
     * Parse JSON string list.
     */
    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("failed_to_parse_json json={}", json, e);
            return List.of();
        }
    }
}
