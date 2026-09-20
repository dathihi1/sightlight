package vn.duy.signlight.identity.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §2 endpoint 14 — `GET /api/v1/me`. */
public record MeResult(
        UUID userId,
        Profile profile,
        Preferences preferences,
        List<String> roles,
        boolean emailVerified) {

    public record Profile(String displayName, String email, String timezone, String avatarUrl) {
    }

    public record Preferences(
            UUID activeCourseId,
            int dailyGoalMinutes,
            String videoSpeed,
            String uiLocale) {
    }
}
