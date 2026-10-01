package vn.duy.signlight.learning.web.dto;

import java.time.Instant;
import java.util.UUID;

public record LessonUnlockResult(
        UUID lessonId,
        String unlockType,
        String paidBy,
        int amountPaid,
        Instant expiresAt,
        boolean isPermanent,
        int remainingExpBalance
) {}
