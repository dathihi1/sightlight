package vn.duy.signlight.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.RefreshToken;
import vn.duy.signlight.identity.domain.UserStatus;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.RefreshTokenRepository;

/**
 * Phat hanh, xoay vong va thu hoi refresh token (BR-A04, AC-02.1, AC-02.4, LLD §1.2).
 */
@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);
    private static final int RAW_TOKEN_BYTE_LENGTH = 32;

    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AppUserRepository appUserRepository;
    private final Duration refreshTokenTtl;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(
            JwtService jwtService,
            RefreshTokenRepository refreshTokenRepository,
            AppUserRepository appUserRepository,
            @Value("${signlight.security.jwt.refresh-token-ttl-days:30}") int refreshTokenTtlDays) {
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.appUserRepository = appUserRepository;
        this.refreshTokenTtl = Duration.ofDays(refreshTokenTtlDays);
    }

    /**
     * Phat hanh cap token moi (Access Token + Refresh Token) khi dang nhap hoac xac thuc thanh cong.
     */
    @Transactional
    public TokenPair issueTokenPair(UUID userId, List<String> roles) {
        String accessToken = jwtService.issueAccessToken(userId, roles);
        String rawRefreshToken = generateRawToken();
        String tokenHash = hashToken(rawRefreshToken);

        Instant now = Instant.now();
        UUID familyId = UUID.randomUUID();

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .expiresAt(now.plus(refreshTokenTtl))
                .revokedAt(null)
                .createdAt(now)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);
        log.info("refresh_token_issued userId={} familyId={}", userId, familyId);

        return new TokenPair(accessToken, rawRefreshToken, jwtService.accessTokenTtl().toSeconds());
    }

    /**
     * Xoay vong refresh token (Token Rotation).
     *
     * <p><b>Phat hien tai su dung (BR-A04, AC-02.4):</b> Neu mot token da tung bi thu hoi (hoac da xoay vong)
     * ma tiep tuc duoc gui len, toan bo ho token (family_id) se bi thu hoi ngay lap tuc va tra ve ma 01204.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW, noRollbackFor = BusinessException.class)
    public TokenPair rotateRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }

        String tokenHash = hashToken(rawRefreshToken.trim());
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        Instant now = Instant.now();

        // Phat hien tai su dung token da thu hoi / da dung truoc do
        if (token.getRevokedAt() != null) {
            log.warn("token_reuse_detected userId={} familyId={} tokenId={}",
                    token.getUserId(), token.getFamilyId(), token.getId());
            refreshTokenRepository.revokeFamily(token.getFamilyId(), now);
            throw new BusinessException(ErrorCode.TOKEN_REUSE_DETECTED);
        }

        // Kiem tra het han
        if (token.getExpiresAt().isBefore(now)) {
            log.debug("refresh_token_expired userId={} tokenId={}", token.getUserId(), token.getId());
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }

        AppUser user = appUserRepository.findById(token.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));

        if (UserStatus.SUSPENDED.value().equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }

        // Thu hoi token hien tai vi da duoc dung
        token.setRevokedAt(now);
        refreshTokenRepository.save(token);

        // Phat hanh token moi trong cung family
        String newRawRefreshToken = generateRawToken();
        String newTokenHash = hashToken(newRawRefreshToken);

        RefreshToken newToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(user.getId())
                .tokenHash(newTokenHash)
                .familyId(token.getFamilyId())
                .expiresAt(now.plus(refreshTokenTtl))
                .revokedAt(null)
                .createdAt(now)
                .build();
        refreshTokenRepository.save(newToken);

        List<String> roles = List.copyOf(user.getRoles());
        String newAccessToken = jwtService.issueAccessToken(user.getId(), roles);

        log.info("refresh_token_rotated userId={} familyId={}", user.getId(), token.getFamilyId());
        return new TokenPair(newAccessToken, newRawRefreshToken, jwtService.accessTokenTtl().toSeconds());
    }

    /**
     * Thu hoi phien dang nhap theo refresh token (khi logout).
     */
    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(rawRefreshToken.trim());
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            Instant now = Instant.now();
            refreshTokenRepository.revokeFamily(token.getFamilyId(), now);
            log.info("refresh_token_revoked userId={} familyId={}", token.getUserId(), token.getFamilyId());
        });
    }

    /**
     * Thu hoi toan bo phien dang nhap cua mot user (khi doi mat khau, reset hoac xoa tai khoan).
     */
    @Transactional
    public void revokeAllForUser(UUID userId) {
        if (userId != null) {
            refreshTokenRepository.revokeAllForUser(userId, Instant.now());
            log.info("all_refresh_tokens_revoked_for_user userId={}", userId);
        }
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }

    private String generateRawToken() {
        byte[] bytes = new byte[RAW_TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record TokenPair(String accessToken, String refreshToken, long expiresInSeconds) {
    }
}
