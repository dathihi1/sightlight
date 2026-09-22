package vn.duy.signlight.identity.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.RefreshToken;
import vn.duy.signlight.identity.domain.UserStatus;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.RefreshTokenRepository;

class TokenServiceTest {

    private JwtService jwtService;
    private RefreshTokenRepository refreshTokenRepository;
    private AppUserRepository appUserRepository;
    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        jwtService = mock(JwtService.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        appUserRepository = mock(AppUserRepository.class);
        tokenService = new TokenService(jwtService, refreshTokenRepository, appUserRepository, 30);

        when(jwtService.accessTokenTtl()).thenReturn(Duration.ofMinutes(15));
    }

    @Test
    @DisplayName("issueTokenPair phat hanh accessToken va refreshToken hop le, luu DB")
    void issueTokenPair_success() {
        UUID userId = UUID.randomUUID();
        List<String> roles = List.of("LEARNER_FREE");
        when(jwtService.issueAccessToken(userId, roles)).thenReturn("jwt-access-token-123");

        TokenService.TokenPair pair = tokenService.issueTokenPair(userId, roles);

        assertNotNull(pair);
        assertEquals("jwt-access-token-123", pair.accessToken());
        assertNotNull(pair.refreshToken());
        assertEquals(900, pair.expiresInSeconds());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("rotateRefreshToken thanh cong khi token con han va chua bi revoke")
    void rotateRefreshToken_success() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawOldToken = "valid-raw-refresh-token";
        String tokenHash = tokenService.hashToken(rawOldToken);

        RefreshToken existingToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .expiresAt(Instant.now().plus(Duration.ofDays(10)))
                .revokedAt(null)
                .createdAt(Instant.now().minus(Duration.ofDays(1)))
                .build();

        AppUser user = AppUser.builder()
                .id(userId)
                .email("test@example.com")
                .status(UserStatus.ACTIVE.value())
                .roles(new LinkedHashSet<>(Set.of("LEARNER_FREE")))
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(existingToken));
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(jwtService.issueAccessToken(eq(userId), any())).thenReturn("new-jwt-access-token");

        TokenService.TokenPair newPair = tokenService.rotateRefreshToken(rawOldToken);

        assertNotNull(newPair);
        assertEquals("new-jwt-access-token", newPair.accessToken());
        assertNotNull(newPair.refreshToken());
        assertNotNull(existingToken.getRevokedAt()); // token cu da bi danh dau revoke
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("rotateRefreshToken phat hien tai su dung (BR-A04) va thu hoi ca family, tra ma 01204")
    void rotateRefreshToken_reuseDetection_revokesFamilyAndThrows() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawToken = "already-used-refresh-token";
        String tokenHash = tokenService.hashToken(rawToken);

        // Token da tung bi revoke truoc do
        RefreshToken revokedToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .expiresAt(Instant.now().plus(Duration.ofDays(10)))
                .revokedAt(Instant.now().minus(Duration.ofHours(2)))
                .createdAt(Instant.now().minus(Duration.ofDays(1)))
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(revokedToken));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                tokenService.rotateRefreshToken(rawToken));

        assertEquals(ErrorCode.TOKEN_REUSE_DETECTED.getCode(), ex.getErrorCode());
        // Bat buoc phai goi revokeFamily khi phat hien reuse
        verify(refreshTokenRepository).revokeFamily(eq(familyId), any(Instant.class));
        verify(appUserRepository, never()).findById(any());
    }

    @Test
    @DisplayName("rotateRefreshToken nem loi UNAUTHENTICATED khi token khong ton tai")
    void rotateRefreshToken_notFound_throwsUnauthenticated() {
        String rawToken = "non-existent-token";
        String tokenHash = tokenService.hashToken(rawToken);

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class, () ->
                tokenService.rotateRefreshToken(rawToken));

        assertEquals(ErrorCode.UNAUTHENTICATED.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("rotateRefreshToken nem loi UNAUTHENTICATED khi token da het han")
    void rotateRefreshToken_expired_throwsUnauthenticated() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawToken = "expired-token";
        String tokenHash = tokenService.hashToken(rawToken);

        RefreshToken expiredToken = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .expiresAt(Instant.now().minus(Duration.ofHours(1)))
                .revokedAt(null)
                .createdAt(Instant.now().minus(Duration.ofDays(31)))
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expiredToken));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                tokenService.rotateRefreshToken(rawToken));

        assertEquals(ErrorCode.UNAUTHENTICATED.getCode(), ex.getErrorCode());
    }

    @Test
    @DisplayName("revokeToken thu hoi ca family khi logout")
    void revokeToken_revokesFamily() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawToken = "active-logout-token";
        String tokenHash = tokenService.hashToken(rawToken);

        RefreshToken token = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(tokenHash)
                .familyId(familyId)
                .expiresAt(Instant.now().plus(Duration.ofDays(10)))
                .revokedAt(null)
                .build();

        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(token));

        tokenService.revokeToken(rawToken);

        verify(refreshTokenRepository).revokeFamily(eq(familyId), any(Instant.class));
    }
}
