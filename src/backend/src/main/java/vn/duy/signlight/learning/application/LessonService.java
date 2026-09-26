package vn.duy.signlight.learning.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.content.domain.Lesson;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.gamification.application.StreakService;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.repository.UserPreferenceRepository;
import vn.duy.signlight.learning.domain.ExerciseAttempt;
import vn.duy.signlight.learning.domain.LessonCompletion;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.repository.ExerciseAttemptRepository;
import vn.duy.signlight.learning.repository.LessonCompletionRepository;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;
import vn.duy.signlight.learning.web.dto.AnswerRequest;
import vn.duy.signlight.learning.web.dto.AnswerResult;
import vn.duy.signlight.learning.web.dto.CompleteLessonRequest;
import vn.duy.signlight.learning.web.dto.CompleteLessonResult;
import vn.duy.signlight.learning.web.dto.LessonResult;

/**
 * Nội dung bài học, chấm điểm và hoàn thành bài (FR-11, FR-12, FR-16).
 *
 * <p><b>Bất biến của module này:</b> đáp án đúng chỉ rời khỏi server <i>sau khi</i> người học đã trả
 * lời (ADR-04, AC-12.4). Vì vậy {@link #lesson} không bao giờ đọc {@code correctAnswerText},
 * {@code correctOrder} hay {@code isCorrect} vào DTO.
 */
@Service
public class LessonService {

    private static final Logger log = LoggerFactory.getLogger(LessonService.class);

    /** Trần thời gian tính vào mục tiêu ngày cho một bài học (BR-A46). */
    private static final int MAX_EFFECTIVE_SECONDS = 15 * 60;

    private static final String TYPE_SIGN_TO_MEANING = "SIGN_TO_MEANING";
    private static final String TYPE_MEANING_TO_SIGN = "MEANING_TO_SIGN";
    private static final String TYPE_TYPE_WHAT_YOU_SEE = "TYPE_WHAT_YOU_SEE";
    private static final String TYPE_SENTENCE_ORDER = "SENTENCE_ORDER";

    private final ContentTreeService contentTree;
    private final MediaUrlService mediaUrlService;
    private final LearningPathService learningPathService;
    private final UserLessonStateRepository lessonStateRepository;
    private final ExerciseAttemptRepository attemptRepository;
    private final LessonCompletionRepository completionRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final StreakService streakService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final vn.duy.signlight.content.application.LessonContentService lessonContentService;

    public LessonService(ContentTreeService contentTree,
            MediaUrlService mediaUrlService,
            LearningPathService learningPathService,
            UserLessonStateRepository lessonStateRepository,
            ExerciseAttemptRepository attemptRepository,
            LessonCompletionRepository completionRepository,
            UserPreferenceRepository preferenceRepository,
            StreakService streakService,
            AuthService authService,
            ObjectMapper objectMapper,
            vn.duy.signlight.content.application.LessonContentService lessonContentService) {
        this.contentTree = contentTree;
        this.mediaUrlService = mediaUrlService;
        this.learningPathService = learningPathService;
        this.lessonStateRepository = lessonStateRepository;
        this.attemptRepository = attemptRepository;
        this.completionRepository = completionRepository;
        this.preferenceRepository = preferenceRepository;
        this.streakService = streakService;
        this.authService = authService;
        this.objectMapper = objectMapper;
        this.lessonContentService = lessonContentService;
    }

    // ----------------------------------------------------------- đọc bài học

    @Transactional
    public LessonResult lesson(UUID userId, UUID lessonId) {
        Lesson lesson = contentTree.requirePublishedLesson(lessonId);
        requireAccess(userId, lesson);

        List<Exercise> exercises = contentTree.exercisesOf(lessonId);
        Map<UUID, List<ExerciseOption>> optionsByExercise = contentTree.optionsOf(
                exercises.stream().map(Exercise::getId).toList());
        Map<UUID, SignVideo> videos = contentTree.primaryVideos(
                exercises.stream().map(Exercise::getSignId).filter(java.util.Objects::nonNull).toList());

        List<LessonResult.ExerciseNode> nodes = new ArrayList<>();
        for (Exercise exercise : exercises) {
            SignVideo video = exercise.getSignId() == null ? null : videos.get(exercise.getSignId());
            List<LessonResult.OptionNode> options = optionsByExercise
                    .getOrDefault(exercise.getId(), List.of()).stream()
                    // Cố ý chỉ lấy id + nhãn: `isCorrect` không bao giờ rời khỏi server ở bước này.
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
        List<vn.duy.signlight.learning.web.dto.ContentBlockNode> blocks = lessonContentService.getPublishedBlocks(lessonId).stream()
                .map(block -> new vn.duy.signlight.learning.web.dto.ContentBlockNode(
                        block.getId(),
                        block.getStableKey(),
                        block.getBlockType(),
                        block.getTitle(),
                        block.getBodyText(),
                        parseJsonPayload(block.getPayload()),
                        block.getSignId(),
                        block.getMediaRef(),
                        block.isRequired()))
                .toList();

        UserLessonState state = touchState(userId, lessonId);
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
                List.of(), // learningObjectives - will be populated from blocks or lesson metadata later
                blocks,
                state.getCurrentExerciseIndex(),
                nodes);
    }

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
     * Với {@code SENTENCE_ORDER}, client nhận các token đã <b>xáo trộn</b> và không kèm thứ tự đúng.
     * Xáo bằng seed cố định theo id bài tập để người học vào lại thấy cùng một thứ tự.
     */
    private List<String> shuffledTokens(Exercise exercise) {
        if (!TYPE_SENTENCE_ORDER.equals(exercise.getType()) || exercise.getCorrectOrder() == null) {
            return null;
        }
        List<String> tokens = new ArrayList<>(readStringList(exercise.getCorrectOrder()));
        java.util.Collections.shuffle(tokens,
                new java.util.Random(exercise.getId().getMostSignificantBits()));
        return tokens;
    }

    // -------------------------------------------------------------- chấm điểm

    @Transactional
    public AnswerResult submitAnswer(UUID userId, UUID lessonId, UUID exerciseId,
            AnswerRequest request) {
        Lesson lesson = contentTree.requirePublishedLesson(lessonId);
        requireAccess(userId, lesson);

        Exercise exercise = contentTree.exercise(exerciseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXERCISE_NOT_IN_LESSON));
        if (!exercise.getLessonId().equals(lessonId)) {
            throw new BusinessException(ErrorCode.EXERCISE_NOT_IN_LESSON);
        }
        if (!exercise.getType().equals(request.getAnswerType())) {
            throw new BusinessException(ErrorCode.ANSWER_TYPE_MISMATCH);
        }

        List<ExerciseOption> options = contentTree.optionsOf(exerciseId);
        boolean correct = grade(exercise, options, request);

        short attemptNo = (short) (attemptRepository.countByUserIdAndExerciseId(userId, exerciseId) + 1);
        attemptRepository.save(ExerciseAttempt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .exerciseId(exerciseId)
                .attemptNo(attemptNo)
                .correct(correct)
                .answerPayload(writeAnswerPayload(request))
                .clientElapsedMs(request.getClientElapsedMs())
                .createdAt(Instant.now())
                .build());

        advanceIndex(userId, lessonId, correct);

        UUID correctOptionId = options.stream()
                .filter(ExerciseOption::isCorrect)
                .map(ExerciseOption::getId)
                .findFirst()
                .orElse(null);

        return new AnswerResult(correct, attemptNo,
                correct ? null : correctOptionId,
                correct ? null : exercise.getCorrectAnswerText(),
                null,
                !correct);
    }

    /** Chấm ở server — client không có tiếng nói nào trong kết quả này (ADR-04). */
    private boolean grade(Exercise exercise, List<ExerciseOption> options, AnswerRequest request) {
        return switch (exercise.getType()) {
            case TYPE_SIGN_TO_MEANING, TYPE_MEANING_TO_SIGN -> options.stream()
                    .anyMatch(option -> option.isCorrect()
                            && option.getId().equals(request.getSelectedOptionId()));
            case TYPE_TYPE_WHAT_YOU_SEE -> matchesTypedAnswer(exercise, request.getTypedAnswer());
            case TYPE_SENTENCE_ORDER -> request.getOrderedTokens() != null
                    && request.getOrderedTokens().equals(readStringList(exercise.getCorrectOrder()));
            default -> {
                log.warn("unsupported_exercise_type type={} exerciseId={}",
                        exercise.getType(), exercise.getId());
                throw new BusinessException(ErrorCode.ANSWER_TYPE_MISMATCH);
            }
        };
    }

    /** So khớp bỏ dấu, bỏ hoa thường, chấp nhận danh sách từ đồng nghĩa của bài tập. */
    private boolean matchesTypedAnswer(Exercise exercise, String typed) {
        if (typed == null || typed.isBlank()) {
            return false;
        }
        String candidate = normalize(typed);
        if (exercise.getCorrectAnswerText() != null
                && candidate.equals(normalize(exercise.getCorrectAnswerText()))) {
            return true;
        }
        return readStringList(exercise.getAcceptedAnswers()).stream()
                .anyMatch(accepted -> candidate.equals(normalize(accepted)));
    }

    private String normalize(String value) {
        String text = Normalizer.normalize(value.trim(), Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return text.replaceAll("\\s+", " ");
    }

    // ------------------------------------------------------------ hoàn thành

    @Transactional
    public CompleteLessonResult complete(UUID userId, UUID lessonId, CompleteLessonRequest request) {
        Lesson lesson = contentTree.requirePublishedLesson(lessonId);
        requireAccess(userId, lesson);

        Optional<LessonCompletion> existing = completionRepository
                .findByUserIdAndIdempotencyKey(userId, request.getIdempotencyKey());
        if (existing.isPresent()) {
            // BR-A31: gọi lại cùng khoá không được cộng dồn phút học lần nữa.
            LessonCompletion completion = existing.get();
            return buildCompletionResult(userId, lesson, completion.getScorePercent(),
                    completion.getEffectiveMinutes(), false);
        }

        List<Exercise> exercises = contentTree.exercisesOf(lessonId);
        int scorePercent = scoreFromFirstAttempts(userId, exercises);
        boolean firstTryPerfect = scorePercent == 100;

        BigDecimal effectiveMinutes = BigDecimal
                .valueOf(Math.min(request.getActiveSeconds(), MAX_EFFECTIVE_SECONDS))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        completionRepository.save(LessonCompletion.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .lessonId(lessonId)
                .idempotencyKey(request.getIdempotencyKey())
                .scorePercent((short) scorePercent)
                .effectiveMinutes(effectiveMinutes)
                .createdAt(Instant.now())
                .build());

        UserLessonState state = touchState(userId, lessonId);
        state.setStatus(UserLessonState.COMPLETED);
        state.setCompletedAt(Instant.now());
        state.setFirstTryPerfect(firstTryPerfect);
        // BR-A20: điểm ghi nhận là điểm lần đầu; lần học lại không được ghi đè xuống thấp hơn.
        if (state.getBestScorePercent() == null || state.getBestScorePercent() < scorePercent) {
            state.setBestScorePercent((short) scorePercent);
        }
        state.setUpdatedAt(Instant.now());
        lessonStateRepository.save(state);

        return buildCompletionResult(userId, lesson, (short) scorePercent, effectiveMinutes, true);
    }

    private CompleteLessonResult buildCompletionResult(UUID userId, Lesson lesson,
            short scorePercent, BigDecimal effectiveMinutes, boolean countActivity) {
        UUID courseId = contentTree.courseIdOfLesson(lesson);
        String timezone = authService.timezoneOf(userId);
        short goalMinutes = preferenceRepository.findById(userId)
                .map(preference -> preference.getDailyGoalMinutes())
                .orElse((short) 10);

        StreakService.Snapshot streak = countActivity
                ? streakService.recordActivity(userId, courseId, timezone, effectiveMinutes, goalMinutes)
                : streakService.current(userId, courseId, timezone);

        UUID nextLessonId = learningPathService.path(userId, courseId).nextLessonId();
        int newSigns = (int) contentTree.exercisesOf(lesson.getId()).stream()
                .map(Exercise::getSignId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .count();

        return new CompleteLessonResult(scorePercent,
                scorePercent == 100,
                effectiveMinutes,
                new CompleteLessonResult.StreakSummary(streak.current(), streak.longest(),
                        streak.freezeCount(), streak.goalMetToday()),
                newSigns,
                nextLessonId);
    }

    /** Điểm tính theo <b>lần trả lời đầu tiên</b> của mỗi câu (BR-A20). */
    private int scoreFromFirstAttempts(UUID userId, List<Exercise> exercises) {
        if (exercises.isEmpty()) {
            return 100;
        }
        List<UUID> exerciseIds = exercises.stream().map(Exercise::getId).toList();
        Map<UUID, Boolean> firstAttemptCorrect = new java.util.HashMap<>();
        for (ExerciseAttempt attempt
                : attemptRepository.findByUserIdAndExerciseIdInOrderByAttemptNoAsc(userId, exerciseIds)) {
            firstAttemptCorrect.putIfAbsent(attempt.getExerciseId(), attempt.isCorrect());
        }
        long correct = exerciseIds.stream()
                .filter(id -> Boolean.TRUE.equals(firstAttemptCorrect.get(id)))
                .count();
        return (int) Math.round(correct * 100.0 / exercises.size());
    }

    // ---------------------------------------------------------------- dùng chung

    private void requireAccess(UUID userId, Lesson lesson) {
        LearningPathService.Access access = learningPathService.accessTo(userId, lesson);
        if (access.premiumLocked()) {
            throw new BusinessException(ErrorCode.PREMIUM_REQUIRED);
        }
        if (!access.unlocked()) {
            throw new BusinessException(ErrorCode.LESSON_LOCKED);
        }
    }

    private UserLessonState touchState(UUID userId, UUID lessonId) {
        return lessonStateRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> lessonStateRepository.save(UserLessonState.builder()
                        .userId(userId)
                        .lessonId(lessonId)
                        .status(UserLessonState.IN_PROGRESS)
                        .firstTryPerfect(false)
                        .currentExerciseIndex((short) 0)
                        .updatedAt(Instant.now())
                        .build()));
    }

    private void advanceIndex(UUID userId, UUID lessonId, boolean correct) {
        UserLessonState state = touchState(userId, lessonId);
        if (correct) {
            state.setCurrentExerciseIndex((short) (state.getCurrentExerciseIndex() + 1));
        }
        if (UserLessonState.NOT_STARTED.equals(state.getStatus())) {
            state.setStatus(UserLessonState.IN_PROGRESS);
        }
        state.setUpdatedAt(Instant.now());
        lessonStateRepository.save(state);
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            log.warn("malformed_json_column value_length={}", json.length());
            return List.of();
        }
    }

    /** Lưu lại câu trả lời thô để truy vết, đã khử HTML. */
    private String writeAnswerPayload(AnswerRequest request) {
        try {
            Map<String, Object> payload = new java.util.LinkedHashMap<>();
            payload.put("answerType", request.getAnswerType());
            payload.put("selectedOptionId", request.getSelectedOptionId());
            payload.put("typedAnswer", stripHtml(request.getTypedAnswer()));
            payload.put("orderedTokens", request.getOrderedTokens());
            return objectMapper.writeValueAsString(payload);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            return null;
        }
    }

    private String stripHtml(String value) {
        return value == null ? null : value.replaceAll("<[^>]*>", "");
    }
}
