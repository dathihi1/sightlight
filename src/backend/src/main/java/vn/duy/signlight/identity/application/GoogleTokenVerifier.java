package vn.duy.signlight.identity.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;

/**
 * Xác thực Google ID Token qua Google OAuth2 tokeninfo endpoint (RFC 7519 / OIDC).
 */
@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={idToken}";

    private final RestClient restClient;

    @Value("${signlight.security.google.client-id:}")
    private String configuredClientId;

    public GoogleTokenVerifier() {
        this.restClient = RestClient.builder().build();
    }

    public GoogleUserPayload verify(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }

        if (configuredClientId == null || configuredClientId.isBlank()) {
            log.warn("google_login_disabled reason=client_id_not_configured");
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }

        try {
            GoogleTokenInfo response = restClient.get()
                    .uri(GOOGLE_TOKENINFO_URL, idToken)
                    .retrieve()
                    .body(GoogleTokenInfo.class);

            if (response == null || response.sub() == null || response.email() == null) {
                log.warn("google_token_invalid reason=empty_payload");
                throw new BusinessException(ErrorCode.UNAUTHENTICATED);
            }

            if (configuredClientId != null && !configuredClientId.isBlank() && response.aud() != null) {
                if (!configuredClientId.equals(response.aud())) {
                    log.warn("google_token_aud_mismatch expected={} actual={}", configuredClientId, response.aud());
                    throw new BusinessException(ErrorCode.UNAUTHENTICATED);
                }
            }

            boolean isVerified = Boolean.parseBoolean(response.emailVerified()) || "true".equalsIgnoreCase(response.emailVerified());
            return new GoogleUserPayload(
                    response.sub(),
                    response.email().toLowerCase().trim(),
                    Optional.ofNullable(response.name()).orElse(response.email().split("@")[0]),
                    response.picture(),
                    isVerified);
        } catch (Exception ex) {
            log.warn("google_token_verify_failed message={}", ex.getMessage());
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }
    }

    public record GoogleUserPayload(
            String sub,
            String email,
            String name,
            String picture,
            boolean emailVerified) {
    }

    record GoogleTokenInfo(
            String sub,
            String email,
            @JsonProperty("email_verified") String emailVerified,
            String name,
            String picture,
            String aud) {
    }
}
