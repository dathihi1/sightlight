package vn.duy.signlight.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.common.mail.EmailService;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.PasswordResetToken;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.PasswordResetTokenRepository;

/**
 * Quen mat khau / dat lai mat khau (FR-04).
 *
 * <p>Endpoint forgot luon tra 200 du email co ton tai hay khong (chong enumeration NFR-08).
 * Token plaintext khong bao gio duoc luu vao CSDL — chi luu SHA-256 hex.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int RESET_TOKEN_EXPIRE_MINUTES = 60;

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password123", "123456789012", "qwerty123456", "matkhau123", "abcd12345678",
            "111111111111", "letmein12345", "admin1234567", "iloveyou1234", "signlight123");

    private final AppUserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Value("${signlight.mail.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    public PasswordResetService(
            AppUserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    /**
     * Yeu cau dat lai mat khau. Luon tra ve binh thuong du email co ton tai hay khong.
     */
    @Transactional
    public void requestReset(String email) {
        String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
        Optional<AppUser> found = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (found.isEmpty()) {
            log.info("password_reset_email_not_found domain={}", maskDomain(normalizedEmail));
            return;
        }

        AppUser user = found.get();
        if (user.getPasswordHash() == null) {
            log.info("password_reset_google_only_account user_id={}", user.getId());
            return;
        }

        tokenRepository.invalidateAllForUser(user.getId());

        String rawToken = UUID.randomUUID().toString();
        String hash = sha256Hex(rawToken);
        Instant now = Instant.now();

        tokenRepository.save(PasswordResetToken.builder()
                .id(UUID.randomUUID())
                .userId(user.getId())
                .tokenHash(hash)
                .expiresAt(now.plus(RESET_TOKEN_EXPIRE_MINUTES, ChronoUnit.MINUTES))
                .createdAt(now)
                .build());

        String resetUrl = frontendBaseUrl + "/dat-lai-mat-khau?token=" + rawToken;
        emailService.sendPasswordResetLink(normalizedEmail, resetUrl);
        log.info("password_reset_email_sent user_id={}", user.getId());
    }

    /**
     * Dat lai mat khau bang token hop le. Yeu cau dang nhap lai sau khi thanh cong.
     */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        if (COMMON_PASSWORDS.contains(newPassword.toLowerCase(java.util.Locale.ROOT))) {
            throw new BusinessException(ErrorCode.PASSWORD_TOO_COMMON);
        }

        String hash = sha256Hex(rawToken);
        PasswordResetToken token = tokenRepository.findByTokenHashAndUsedAtIsNull(hash)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESET_TOKEN_INVALID));

        Instant now = Instant.now();
        if (token.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.RESET_TOKEN_EXPIRED);
        }

        AppUser user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESET_TOKEN_INVALID));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(now);
        user.setFailedLoginCount((short) 0);
        user.setLockedUntil(null);
        userRepository.save(user);

        token.setUsedAt(now);
        tokenRepository.save(token);

        tokenRepository.invalidateAllForUser(user.getId());
        tokenService.revokeAllForUser(user.getId());

        log.info("password_reset_success user_id={}", user.getId());
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private String maskDomain(String email) {
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at) : "unknown";
    }
}
