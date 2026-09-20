package vn.duy.signlight.airecognition.web.dto;

import java.util.List;
import java.util.UUID;

/**
 * api-spec §3.12c.
 *
 * <p>`verified` do **backend** quyết định, không phải dịch vụ AI (ADR-09). `top3` chỉ xuất hiện khi
 * `wrong_target` hoặc `uncertain_intent` — đó là lúc nó có giá trị dạy học.
 */
public record AiAttemptResult(
        UUID attemptId,
        boolean verified,
        String status,
        Double confidence,
        UUID predictedSignId,
        String predictedLabel,
        List<Prediction> top3,
        List<String> qualityHints,
        boolean countedAgainstQuota,
        Integer quotaRemaining,
        int consecutiveFailures,
        boolean stubMode) {

    public record Prediction(UUID signId, String label, double confidence) {
    }
}
