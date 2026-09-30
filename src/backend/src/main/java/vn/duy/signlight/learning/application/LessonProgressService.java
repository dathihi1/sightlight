package vn.duy.signlight.learning.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.learning.domain.ExerciseAttempt;
import vn.duy.signlight.learning.domain.UserLessonState;
import vn.duy.signlight.learning.repository.ExerciseAttemptRepository;
import vn.duy.signlight.learning.repository.UserLessonStateRepository;

/**
 * Service quản lý tiến độ học bài.
 *
 * <p>Trách nhiệm:
 * <ul>
 *   <li>Touch/tạo state khi bắt đầu lesson</li>
 *   <li>Lưu exercise attempts</li>
 *   <li>Advance progress với stable key</li>
 *   <li>Resume theo stable key hoặc fallback index</li>
 * </ul>
 */
@Service
@Transactional
public class LessonProgressService {

    private static final Logger log = LoggerFactory.getLogger(LessonProgressService.class);

    private final UserLessonStateRepository lessonStateRepository;
    private final ExerciseAttemptRepository attemptRepository;

    public LessonProgressService(
            UserLessonStateRepository lessonStateRepository,
            ExerciseAttemptRepository attemptRepository) {
        this.lessonStateRepository = lessonStateRepository;
        this.attemptRepository = attemptRepository;
    }

    /**
     * Touch lesson state: tạo mới nếu chưa có, cập nhật updatedAt nếu đã có.
     *
     * @param userId ID người học
     * @param lessonId ID bài học
     * @param contentVersion content version hiện tại của lesson
     * @return state hiện tại
     */
    public UserLessonState touchState(UUID userId, UUID lessonId, int contentVersion) {
        Optional<UserLessonState> existing = lessonStateRepository.findById(
                new vn.duy.signlight.learning.domain.UserLessonStateId(userId, lessonId));

        if (existing.isPresent()) {
            UserLessonState state = existing.get();
            state.setUpdatedAt(Instant.now());

            // Track content version seen
            if (state.getContentVersionSeen() == null) {
                state.setContentVersionSeen(contentVersion);
            }

            return lessonStateRepository.save(state);
        }

        // Tạo mới
        UserLessonState newState = UserLessonState.builder()
                .userId(userId)
                .lessonId(lessonId)
                .status(UserLessonState.NOT_STARTED)
                .currentExerciseIndex((short) 0)
                .firstTryPerfect(true)
                .contentVersionSeen(contentVersion)
                .updatedAt(Instant.now())
                .build();

        return lessonStateRepository.save(newState);
    }

    /**
     * Lưu attempt sau khi chấm điểm.
     *
     * @param userId ID người học
     * @param exerciseId ID bài tập
     * @param isCorrect kết quả chấm
     * @param answerPayload JSON payload của câu trả lời
     * @param clientElapsedMs thời gian client
     * @return attempt number (1-indexed)
     */
    public short recordAttempt(
            UUID userId,
            UUID exerciseId,
            boolean isCorrect,
            String answerPayload,
            Integer clientElapsedMs) {

        short attemptNo = (short) (attemptRepository.countByUserIdAndExerciseId(userId, exerciseId) + 1);

        attemptRepository.save(ExerciseAttempt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .exerciseId(exerciseId)
                .attemptNo(attemptNo)
                .correct(isCorrect)
                .answerPayload(answerPayload)
                .clientElapsedMs(clientElapsedMs)
                .createdAt(Instant.now())
                .build());

        return attemptNo;
    }

    /**
     * Advance progress sau khi trả lời đúng.
     *
     * <p>Ưu tiên dùng stable key nếu có, fallback sang index.
     *
     * @param userId ID người học
     * @param lessonId ID bài học
     * @param currentExercise exercise hiện tại
     * @param nextIndex index tiếp theo
     * @param nextExerciseKey stable key của exercise tiếp theo (nếu có)
     * @param isCorrect câu trả lời có đúng không
     */
    public void advanceProgress(
            UUID userId,
            UUID lessonId,
            Exercise currentExercise,
            int nextIndex,
            String nextExerciseKey,
            boolean isCorrect) {

        UserLessonState state = lessonStateRepository.findById(
                new vn.duy.signlight.learning.domain.UserLessonStateId(userId, lessonId))
                .orElseThrow();

        // Chỉ advance nếu đúng
        if (isCorrect) {
            state.setCurrentExerciseIndex((short) nextIndex);

            // Set stable key nếu có
            if (nextExerciseKey != null && !nextExerciseKey.isBlank()) {
                state.setCurrentExerciseKey(nextExerciseKey);
            }

            // Update status
            if (UserLessonState.NOT_STARTED.equals(state.getStatus())) {
                state.setStatus(UserLessonState.IN_PROGRESS);
            }
        } else {
            // Sai thì không còn perfect
            state.setFirstTryPerfect(false);
        }

        state.setUpdatedAt(Instant.now());
        lessonStateRepository.save(state);
    }

    /**
     * Lấy resume index từ state.
     *
     * <p>Ưu tiên stable key, fallback sang index.
     *
     * @param state lesson state
     * @param exercises danh sách exercises
     * @return index để resume
     */
    public int getResumeIndex(UserLessonState state, java.util.List<Exercise> exercises) {
        // Ưu tiên stable key
        if (state.getCurrentExerciseKey() != null && !state.getCurrentExerciseKey().isBlank()) {
            for (int i = 0; i < exercises.size(); i++) {
                if (state.getCurrentExerciseKey().equals(exercises.get(i).getStableKey())) {
                    return i;
                }
            }
            log.warn("exercise_key_not_found key={} lessonId={}, fallback to index",
                    state.getCurrentExerciseKey(), state.getLessonId());
        }

        // Fallback to index
        return Math.min(state.getCurrentExerciseIndex(), exercises.size() - 1);
    }
}
