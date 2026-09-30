package vn.duy.signlight.learning.application;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.domain.Exercise;
import vn.duy.signlight.content.domain.ExerciseOption;
import vn.duy.signlight.learning.web.dto.AnswerRequest;

/**
 * Service chấm điểm bài tập.
 *
 * <p>Trách nhiệm duy nhất: chấm đáp án của người học theo exercise type.
 * Không chứa logic về tiến độ, state hoặc dựng DTO.
 *
 * <p><b>Security:</b> Đáp án đúng không bao giờ đến từ client (ADR-04, AC-12.4).
 */
@Service
public class ExerciseGradingService {

    private static final Logger log = LoggerFactory.getLogger(ExerciseGradingService.class);

    private static final String TYPE_SIGN_TO_MEANING = "SIGN_TO_MEANING";
    private static final String TYPE_MEANING_TO_SIGN = "MEANING_TO_SIGN";
    private static final String TYPE_TYPE_WHAT_YOU_SEE = "TYPE_WHAT_YOU_SEE";
    private static final String TYPE_SENTENCE_ORDER = "SENTENCE_ORDER";
    private static final String TYPE_SIGN_VIDEO_RECALL = "SIGN_VIDEO_RECALL";
    private static final String TYPE_MATCH_SIGN_MEANING = "MATCH_SIGN_MEANING";

    private final ObjectMapper objectMapper;

    public ExerciseGradingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Chấm bài tập dựa trên type.
     *
     * @param exercise bài tập cần chấm
     * @param options danh sách options (nếu có)
     * @param request câu trả lời từ client
     * @return true nếu đúng, false nếu sai
     * @throws BusinessException nếu exercise type không được hỗ trợ
     */
    public boolean grade(Exercise exercise, List<ExerciseOption> options, AnswerRequest request) {
        return switch (exercise.getType()) {
            case TYPE_SIGN_TO_MEANING, TYPE_MEANING_TO_SIGN -> gradeChoice(options, request);
            case TYPE_TYPE_WHAT_YOU_SEE, TYPE_SIGN_VIDEO_RECALL -> gradeTypedAnswer(exercise, request);
            case TYPE_SENTENCE_ORDER -> gradeOrder(exercise, request);
            case TYPE_MATCH_SIGN_MEANING -> gradeMatching(exercise, options, request);
            default -> {
                log.warn("unsupported_exercise_type type={} exerciseId={}",
                        exercise.getType(), exercise.getId());
                throw new BusinessException(ErrorCode.ANSWER_TYPE_MISMATCH);
            }
        };
    }

    /**
     * Chấm bài tập chọn đáp án (SIGN_TO_MEANING, MEANING_TO_SIGN).
     */
    private boolean gradeChoice(List<ExerciseOption> options, AnswerRequest request) {
        if (request.getSelectedOptionId() == null) {
            return false;
        }
        return options.stream()
                .anyMatch(option -> option.isCorrect()
                        && option.getId().equals(request.getSelectedOptionId()));
    }

    /**
     * Chấm bài tập nhập đáp án (TYPE_WHAT_YOU_SEE, SIGN_VIDEO_RECALL).
     *
     * <p>So khớp bỏ dấu, bỏ hoa thường, chấp nhận danh sách acceptedAnswers.
     */
    private boolean gradeTypedAnswer(Exercise exercise, AnswerRequest request) {
        if (request.getTypedAnswer() == null || request.getTypedAnswer().isBlank()) {
            return false;
        }

        String candidate = normalize(request.getTypedAnswer());

        // Check correct answer text
        if (exercise.getCorrectAnswerText() != null
                && candidate.equals(normalize(exercise.getCorrectAnswerText()))) {
            return true;
        }

        // Check accepted answers
        List<String> acceptedAnswers = readStringList(exercise.getAcceptedAnswers());
        return acceptedAnswers.stream()
                .anyMatch(accepted -> candidate.equals(normalize(accepted)));
    }

    /**
     * Chấm bài tập sắp xếp câu (SENTENCE_ORDER).
     */
    private boolean gradeOrder(Exercise exercise, AnswerRequest request) {
        if (request.getOrderedTokens() == null) {
            return false;
        }

        List<String> correctOrder = readStringList(exercise.getCorrectOrder());
        return request.getOrderedTokens().equals(correctOrder);
    }

    /**
     * Chấm bài tập ghép (MATCH_SIGN_MEANING).
     *
     * <p>Validate:
     * <ul>
     *   <li>Có đủ số cặp</li>
     *   <li>Không có duplicate</li>
     *   <li>Mỗi cặp đều hợp lệ</li>
     * </ul>
     *
     * <p><b>TODO:</b> Implement production grading logic.
     * Hiện tại chỉ validate structure, chưa chấm matching thực tế.
     */
    private boolean gradeMatching(Exercise exercise, List<ExerciseOption> options, AnswerRequest request) {
        if (request.getMatches() == null || request.getMatches().isEmpty()) {
            return false;
        }

        // Số cặp phải bằng số options
        if (request.getMatches().size() != options.size()) {
            log.warn("matching_count_mismatch expected={} actual={}", options.size(), request.getMatches().size());
            return false;
        }

        // Kiểm tra duplicate
        long uniquePrompts = request.getMatches().stream()
                .map(AnswerRequest.MatchPair::getPromptId)
                .distinct()
                .count();
        long uniqueOptions = request.getMatches().stream()
                .map(AnswerRequest.MatchPair::getOptionId)
                .distinct()
                .count();

        if (uniquePrompts != request.getMatches().size() || uniqueOptions != request.getMatches().size()) {
            log.warn("matching_has_duplicates");
            return false;
        }

        // Validate tất cả IDs đều thuộc exercise
        var optionIds = options.stream().map(ExerciseOption::getId).toList();
        boolean allValid = request.getMatches().stream()
                .allMatch(pair -> optionIds.contains(pair.getOptionId()));

        if (!allValid) {
            log.warn("matching_invalid_option_ids");
            return false;
        }

        // TODO: Implement proper matching validation
        // Convention: option[i] matches prompt[i] based on orderIndex
        log.warn("matching_grading_not_fully_implemented exerciseId={}", exercise.getId());
        return true; // Placeholder
    }

    /**
     * Normalize text: bỏ dấu, lowercase, trim spaces.
     */
    private String normalize(String value) {
        String text = Normalizer.normalize(value.trim(), Normalizer.Form.NFKD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return text.replaceAll("\\s+", " ");
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
