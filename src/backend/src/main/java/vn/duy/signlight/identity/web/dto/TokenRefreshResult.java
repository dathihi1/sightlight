package vn.duy.signlight.identity.web.dto;

/** api-spec §3.20. */
public record TokenRefreshResult(
        String accessToken,
        String refreshToken,
        long expiresInSeconds) {
}
