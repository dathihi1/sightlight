package vn.duy.signlight.identity.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §3.2. */
public record LoginResult(
        String accessToken,
        UUID userId,
        List<String> roles,
        UUID activeCourseId,
        boolean requiresEmailVerification,
        boolean pendingDeletion) {
}
