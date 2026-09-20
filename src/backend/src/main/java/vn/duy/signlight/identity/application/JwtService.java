package vn.duy.signlight.identity.application;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Phát hành và xác thực access token (NFR-09: hiệu lực 15 phút).
 *
 * <p>Refresh token 30 ngày có xoay vòng sẽ đến ở lát sau — hiện client đăng nhập lại khi hết hạn.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String CLAIM_ROLES = "roles";
    private static final int MIN_SECRET_BYTES = 32;

    private final byte[] secret;
    private final Duration accessTokenTtl;
    private final String issuer;

    public JwtService(
            @Value("${signlight.security.jwt.secret}") String secret,
            @Value("${signlight.security.jwt.access-token-ttl}") Duration accessTokenTtl,
            @Value("${signlight.security.jwt.issuer}") String issuer) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < MIN_SECRET_BYTES) {
            // Khoá ngắn làm HMAC-SHA256 mất an toàn — dừng ngay lúc khởi động, không chạy tiếp.
            throw new IllegalStateException(
                    "signlight.security.jwt.secret phải dài ít nhất " + MIN_SECRET_BYTES + " byte");
        }
        this.accessTokenTtl = accessTokenTtl;
        this.issuer = issuer;
    }

    public String issueAccessToken(UUID userId, List<String> roles) {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(userId.toString())
                .issuer(issuer)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(accessTokenTtl)))
                .jwtID(UUID.randomUUID().toString())
                .claim(CLAIM_ROLES, roles)
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        try {
            jwt.sign(new MACSigner(secret));
        } catch (JOSEException ex) {
            throw new IllegalStateException("Không ký được access token", ex);
        }
        return jwt.serialize();
    }

    /** Trả rỗng khi token sai chữ ký, hết hạn, sai issuer hoặc không phân tích được. */
    public Optional<AuthenticatedUser> verify(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) {
                return Optional.empty();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            if (!issuer.equals(claims.getIssuer())) {
                return Optional.empty();
            }
            Date expiry = claims.getExpirationTime();
            if (expiry == null || expiry.toInstant().isBefore(Instant.now())) {
                return Optional.empty();
            }
            List<String> roles = claims.getStringListClaim(CLAIM_ROLES);
            return Optional.of(new AuthenticatedUser(
                    UUID.fromString(claims.getSubject()),
                    roles == null ? List.of() : roles));
        } catch (ParseException | JOSEException | IllegalArgumentException ex) {
            log.debug("token_rejected reason={}", ex.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    public Duration accessTokenTtl() {
        return accessTokenTtl;
    }

    /** Danh tính rút ra từ token — không chạm CSDL ở mỗi request. */
    public record AuthenticatedUser(UUID userId, List<String> roles) {
    }
}
