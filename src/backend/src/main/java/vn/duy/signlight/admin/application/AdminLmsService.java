package vn.duy.signlight.admin.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.admin.web.dto.AdminLessonDetailDto;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.LessonContentBlock;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.repository.ExerciseOptionRepository;
import vn.duy.signlight.content.repository.ExerciseRepository;
import vn.duy.signlight.content.repository.LessonContentBlockRepository;
import vn.duy.signlight.content.repository.LessonRepository;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;

@Service
public class AdminLmsService {

    private static final Logger log = LoggerFactory.getLogger(AdminLmsService.class);

    private final LessonRepository lessonRepository;
    private final ExerciseRepository exerciseRepository;
    private final ExerciseOptionRepository optionRepository;
    private final LessonContentBlockRepository blockRepository;
    private final SignRepository signRepository;
    private final SignVideoRepository signVideoRepository;
    private final MediaUrlService mediaUrlService;

    public AdminLmsService(
            LessonRepository lessonRepository,
            ExerciseRepository exerciseRepository,
            ExerciseOptionRepository optionRepository,
            LessonContentBlockRepository blockRepository,
            SignRepository signRepository,
            SignVideoRepository signVideoRepository,
            MediaUrlService mediaUrlService) {
        this.lessonRepository = lessonRepository;
        this.exerciseRepository = exerciseRepository;
        this.optionRepository = optionRepository;
        this.blockRepository = blockRepository;
        this.signRepository = signRepository;
        this.signVideoRepository = signVideoRepository;
        this.mediaUrlService = mediaUrlService;
    }

    @Transactional(readOnly = true)
    public AdminLessonDetailDto getLessonDetail(UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        List<Exercise> exercises = exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        List<UUID> exIds = exercises.stream().map(Exercise::getId).toList();
        List<ExerciseOption> allOptions = exIds.isEmpty()
                ? List.of()
                : optionRepository.findByExerciseIdInOrderByOrderIndexAsc(exIds);
        Map<UUID, List<ExerciseOption>> optionsByEx = allOptions.stream()
                .collect(Collectors.groupingBy(ExerciseOption::getExerciseId));

        List<UUID> signIds = exercises.stream()
                .map(Exercise::getSignId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, Sign> signMap = signIds.isEmpty()
                ? Map.of()
                : signRepository.findAllById(signIds).stream()
                        .collect(Collectors.toMap(Sign::getId, Function.identity()));

        List<SignVideo> videos = signIds.isEmpty() ? List.of() : signVideoRepository.findBySignIdInOrderByPrimaryVariantDesc(signIds);
        Map<UUID, SignVideo> primaryVideos = videos.stream()
                .filter(SignVideo::isPrimaryVariant)
                .collect(Collectors.toMap(SignVideo::getSignId, Function.identity(), (a, b) -> a));

        List<AdminLessonDetailDto.AdminExerciseDto> exDtos = exercises.stream().map(ex -> {
            Sign sign = ex.getSignId() != null ? signMap.get(ex.getSignId()) : null;
            SignVideo video = ex.getSignId() != null ? primaryVideos.get(ex.getSignId()) : null;
            String videoUrl = video != null ? mediaUrlService.resolveVideoUrl(video) : null;
            List<AdminLessonDetailDto.AdminOptionDto> optDtos = optionsByEx
                    .getOrDefault(ex.getId(), List.of()).stream()
                    .map(opt -> new AdminLessonDetailDto.AdminOptionDto(
                            opt.getId(),
                            opt.getOrderIndex(),
                            opt.getLabelText(),
                            opt.isCorrect(),
                            opt.getSignVideoId()
                    )).toList();

            return new AdminLessonDetailDto.AdminExerciseDto(
                    ex.getId(),
                    ex.getLessonId(),
                    ex.getOrderIndex(),
                    ex.getType(),
                    ex.getSkill(),
                    ex.getDifficulty(),
                    ex.getPromptText(),
                    ex.getInstructionText(),
                    ex.getCorrectAnswerText(),
                    ex.getAcceptedAnswers(),
                    ex.getSignId(),
                    sign != null ? sign.getWord() : null,
                    videoUrl,
                    ex.isActive(),
                    optDtos
            );
        }).toList();

        List<LessonContentBlock> blocks = blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        List<AdminLessonDetailDto.AdminBlockDto> blockDtos = blocks.stream()
                .map(b -> new AdminLessonDetailDto.AdminBlockDto(
                        b.getId(),
                        b.getLessonId(),
                        b.getOrderIndex(),
                        b.getStableKey(),
                        b.getBlockType(),
                        b.getTitle(),
                        b.getBodyText(),
                        b.getMediaRef(),
                        b.isRequired(),
                        b.getStatus()
                )).toList();

        return new AdminLessonDetailDto(
                lesson.getId(),
                lesson.getChapterId(),
                lesson.getTitle(),
                lesson.getOrderIndex(),
                lesson.getType(),
                lesson.getEstimatedMinutes(),
                lesson.getStatus(),
                lesson.getStableKey(),
                lesson.getSummary(),
                lesson.getTopic(),
                lesson.getTargetLevel(),
                lesson.getContentVersion(),
                lesson.getPublishedAt(),
                exDtos,
                blockDtos
        );
    }

    /**
     * Sắp xếp lại thứ tự bài tập trong bài học.
     * Áp dụng DEFERRABLE UNIQUE CONSTRAINT đã cấu hình ở V10.
     */
    @Transactional
    public void reorderExercises(UUID lessonId, List<UUID> orderedIds) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        List<Exercise> exercises = exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        Map<UUID, Exercise> map = exercises.stream().collect(Collectors.toMap(Exercise::getId, Function.identity()));

        if (orderedIds.size() != exercises.size()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            UUID id = orderedIds.get(i);
            Exercise ex = map.get(id);
            if (ex == null) {
                throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
            }
            ex.setOrderIndex(i);
        }

        exerciseRepository.saveAll(exercises);
        lesson.setContentVersion(lesson.getContentVersion() + 1);
        lessonRepository.save(lesson);
        log.info("exercises_reordered lesson_id={} count={}", lessonId, orderedIds.size());
    }

    /**
     * Sắp xếp lại thứ tự content blocks trong bài học.
     */
    @Transactional
    public void reorderBlocks(UUID lessonId, List<UUID> orderedIds) {
        List<LessonContentBlock> blocks = blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        Map<UUID, LessonContentBlock> map = blocks.stream()
                .collect(Collectors.toMap(LessonContentBlock::getId, Function.identity()));

        if (orderedIds.size() != blocks.size()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            UUID id = orderedIds.get(i);
            LessonContentBlock b = map.get(id);
            if (b == null) {
                throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
            }
            b.setOrderIndex(i);
        }

        blockRepository.saveAll(blocks);
        log.info("blocks_reordered lesson_id={} count={}", lessonId, orderedIds.size());
    }

    /**
     * Thêm bài tập mới vào cuối bài học.
     */
    @Transactional
    public UUID createExercise(UUID lessonId, AdminLessonDetailDto.ExerciseUpsertRequest req) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        List<Exercise> existing = exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        int nextOrder = existing.size();

        UUID exId = UUID.randomUUID();
        Exercise exercise = Exercise.builder()
                .id(exId)
                .lessonId(lessonId)
                .orderIndex(nextOrder)
                .type(req.type() != null ? req.type() : "SIGN_TO_MEANING")
                .skill(req.skill() != null ? req.skill() : "RECOGNITION")
                .difficulty(req.difficulty() != null ? req.difficulty() : "BASIC")
                .promptText(req.promptText())
                .instructionText(req.instructionText())
                .correctAnswerText(req.correctAnswerText())
                .acceptedAnswers(req.acceptedAnswers() != null ? req.acceptedAnswers() : "[]")
                .signId(req.signId())
                .active(true)
                .contentVersion(1)
                .evaluationVersion(1)
                .build();
        exerciseRepository.save(exercise);

        if (req.options() != null && !req.options().isEmpty()) {
            List<ExerciseOption> options = new ArrayList<>();
            for (int i = 0; i < req.options().size(); i++) {
                var optReq = req.options().get(i);
                options.add(ExerciseOption.builder()
                        .id(UUID.randomUUID())
                        .exerciseId(exId)
                        .orderIndex(i)
                        .labelText(optReq.labelText())
                        .correct(optReq.isCorrect())
                        .build());
            }
            optionRepository.saveAll(options);
        }

        lesson.setContentVersion(lesson.getContentVersion() + 1);
        lessonRepository.save(lesson);
        log.info("exercise_created lesson_id={} ex_id={}", lessonId, exId);
        return exId;
    }

    /**
     * Cập nhật thông tin bài tập.
     */
    @Transactional
    public void updateExercise(UUID exerciseId, AdminLessonDetailDto.ExerciseUpsertRequest req) {
        Exercise ex = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (req.type() != null) ex.setType(req.type());
        if (req.skill() != null) ex.setSkill(req.skill());
        if (req.difficulty() != null) ex.setDifficulty(req.difficulty());
        ex.setPromptText(req.promptText());
        ex.setInstructionText(req.instructionText());
        ex.setCorrectAnswerText(req.correctAnswerText());
        if (req.acceptedAnswers() != null) ex.setAcceptedAnswers(req.acceptedAnswers());
        ex.setSignId(req.signId());
        ex.setContentVersion(ex.getContentVersion() + 1);
        exerciseRepository.save(ex);

        if (req.options() != null) {
            optionRepository.deleteByExerciseId(exerciseId);
            List<ExerciseOption> options = new ArrayList<>();
            for (int i = 0; i < req.options().size(); i++) {
                var optReq = req.options().get(i);
                options.add(ExerciseOption.builder()
                        .id(UUID.randomUUID())
                        .exerciseId(exerciseId)
                        .orderIndex(i)
                        .labelText(optReq.labelText())
                        .correct(optReq.isCorrect())
                        .build());
            }
            optionRepository.saveAll(options);
        }

        lessonRepository.findById(ex.getLessonId()).ifPresent(lesson -> {
            lesson.setContentVersion(lesson.getContentVersion() + 1);
            lessonRepository.save(lesson);
        });
        log.info("exercise_updated ex_id={}", exerciseId);
    }

    /**
     * Xóa bài tập và tái lập chỉ số thứ tự liên tục (0, 1, 2...).
     */
    @Transactional
    public void deleteExercise(UUID exerciseId) {
        Exercise ex = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        UUID lessonId = ex.getLessonId();

        optionRepository.deleteByExerciseId(exerciseId);
        exerciseRepository.delete(ex);

        // Re-index remaining exercises
        List<Exercise> remaining = exerciseRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i);
        }
        exerciseRepository.saveAll(remaining);

        lessonRepository.findById(lessonId).ifPresent(lesson -> {
            lesson.setContentVersion(lesson.getContentVersion() + 1);
            lessonRepository.save(lesson);
        });
        log.info("exercise_deleted ex_id={} lesson_id={}", exerciseId, lessonId);
    }

    /**
     * Thêm content block mới vào bài học.
     */
    @Transactional
    public UUID createBlock(UUID lessonId, AdminLessonDetailDto.BlockUpsertRequest req) {
        List<LessonContentBlock> existing = blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        int nextOrder = existing.size();

        UUID blockId = UUID.randomUUID();
        String stableKey = req.stableKey() != null && !req.stableKey().isBlank()
                ? req.stableKey()
                : "block-" + UUID.randomUUID().toString().substring(0, 8);

        LessonContentBlock block = LessonContentBlock.builder()
                .id(blockId)
                .lessonId(lessonId)
                .orderIndex(nextOrder)
                .stableKey(stableKey)
                .blockType(req.blockType() != null ? req.blockType() : "INTRO")
                .title(req.title())
                .bodyText(req.bodyText())
                .mediaRef(req.mediaRef())
                .signId(req.signId())
                .required(req.isRequired())
                .status(req.status() != null ? req.status() : "PUBLISHED")
                .contentVersion(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        blockRepository.save(block);
        log.info("block_created lesson_id={} block_id={}", lessonId, blockId);
        return blockId;
    }

    /**
     * Cập nhật content block.
     */
    @Transactional
    public void updateBlock(UUID blockId, AdminLessonDetailDto.BlockUpsertRequest req) {
        LessonContentBlock b = blockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (req.blockType() != null) b.setBlockType(req.blockType());
        if (req.title() != null) b.setTitle(req.title());
        if (req.bodyText() != null) b.setBodyText(req.bodyText());
        if (req.mediaRef() != null) b.setMediaRef(req.mediaRef());
        if (req.signId() != null) b.setSignId(req.signId());
        b.setRequired(req.isRequired());
        if (req.status() != null) b.setStatus(req.status());
        b.setUpdatedAt(Instant.now());
        blockRepository.save(b);
        log.info("block_updated block_id={}", blockId);
    }

    /**
     * Xóa content block và re-index.
     */
    @Transactional
    public void deleteBlock(UUID blockId) {
        LessonContentBlock b = blockRepository.findById(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        UUID lessonId = b.getLessonId();
        blockRepository.delete(b);

        List<LessonContentBlock> remaining = blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setOrderIndex(i);
        }
        blockRepository.saveAll(remaining);
        log.info("block_deleted block_id={} lesson_id={}", blockId, lessonId);
    }

    /**
     * Cập nhật metadata bài học.
     */
    @Transactional
    public void updateLesson(UUID lessonId, String title, String summary, String topic, String targetLevel, String status, Short estimatedMinutes) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (title != null) lesson.setTitle(title);
        if (summary != null) lesson.setSummary(summary);
        if (topic != null) lesson.setTopic(topic);
        if (targetLevel != null) lesson.setTargetLevel(targetLevel);
        if (status != null) lesson.setStatus(status);
        if (estimatedMinutes != null) lesson.setEstimatedMinutes(estimatedMinutes);
        lesson.setContentVersion(lesson.getContentVersion() + 1);
        lessonRepository.save(lesson);
        log.info("lesson_metadata_updated lesson_id={}", lessonId);
    }
}
