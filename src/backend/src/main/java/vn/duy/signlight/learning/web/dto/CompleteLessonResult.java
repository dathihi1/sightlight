package vn.duy.signlight.learning.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** api-spec §3.7. */
public record CompleteLessonResult(
        int scorePercent,
        boolean firstTryPerfect,
        BigDecimal effectiveMinutes,
        StreakSummary streak,
        int newSignsLearned,
        UUID nextLessonId,
        int earnedExp) {

    public record StreakSummary(int current, int longest, int freezeCount, boolean goalMetToday) {
    }
}
