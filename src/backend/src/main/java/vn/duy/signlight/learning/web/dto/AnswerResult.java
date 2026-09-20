package vn.duy.signlight.learning.web.dto;

import java.util.UUID;

/** api-spec §3.6 — `correctOptionId` chỉ xuất hiện **sau khi** đã chấm xong lượt này. */
public record AnswerResult(
        boolean isCorrect,
        int attemptNo,
        UUID correctOptionId,
        String correctAnswerText,
        String explanationVideoUrl,
        boolean willRepeat) {
}
