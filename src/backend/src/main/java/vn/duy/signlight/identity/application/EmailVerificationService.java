package vn.duy.signlight.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.common.mail.EmailService;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.EmailVerificationToken;
import vn.duy.signlight.identity.domain.UserStatus;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.EmailVerificationTokenRepository;
import vn.duy.signlight.identity.repository.UserPreferenceRepository;
import vn.duy.signlight.identity.web.dto.LoginResult;

/**
 * Quan ly xac nhan email bang OTP 6 so (FR-01b).
 *
 * <p>OTP plaintext khong bao gio duoc luu vao CSDL — chi luu SHA-256 hex.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private static final int OTP_EXPIRE_MINUTES = 15;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final AppUserRepository userRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(
            AppUserRepository userRepository,
            UserPreferenceRepository preferenceRepository,
            EmailVerificationTokenRepository tokenRepository,
            EmailService emailService,
            JwtService jwtService,
            TokenService tokenService) {
        this.userRepository = userRepository;
        this.preferenceRepository = preferenceRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.tokenService = tokenService;
    }

    /**
     * Sinh OTP moi va gui email xac nhan. Vo hieu cac OTP cu truoc khi tao moi.
     */
    @Transactional
    public void sendOtp(UUID userId, String email) {
        tokenRepository.invalidateAllForUser(userId);

        String otp = generateOtp();
        String hash = sha256Hex(otp);
        Instant now = Instant.now();

        tokenRepository.save(EmailVerificationToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(hash)
                .expiresAt(now.plus(OTP_EXPIRE_MINUTES, ChronoUnit.MINUTES))
                .createdAt(now)
                .build());

        emailService.sendVerificationOtp(email, otp);
        log.info("otp_sent user_id={}", userId);
    }

    /**
     * Xac nhan OTP. Neu dung: danh dau email verified, cap nhat status ACTIVE, tra access token.
     */
    @Transactional
    public LoginResult verifyOtp(String email, String otp) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_INVALID));

        if (user.getEmailVerifiedAt() != null) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        String hash = sha256Hex(otp);
        EmailVerificationToken token = tokenRepository.findByTokenHashAndUsedAtIsNull(hash)
                .filter(t -> t.getUserId().equals(user.getId()))
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_INVALID));

        Instant now = Instant.now();
        if (token.getExpiresAt().isBefore(now)) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        token.setUsedAt(now);
        tokenRepository.save(token);

        user.setEmailVerifiedAt(now);
        user.setStatus(UserStatus.ACTIVE.value());
        user.setUpdatedAt(now);
        userRepository.save(user);

        log.info("email_verified user_id={}", user.getId());

        UUID activeCourseId = preferenceRepository.findById(user.getId())
                .map(p -> p.getActiveCourseId())
                .orElse(null);
        List<String> roles = List.copyOf(user.getRoles());
        TokenService.TokenPair tokenPair = tokenService.issueTokenPair(user.getId(), roles);

        return new LoginResult(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                user.getId(),
                roles,
                activeCourseId,
                false,
                false);
    }

    /**
     * Gui lai OTP — rate limit: toi thieu 60 giay giua 2 lan gui.
     */
    @Transactional
    public void resendOtp(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.OTP_INVALID));

        if (user.getEmailVerifiedAt() != null) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        tokenRepository.findFirstByUserIdOrderByCreatedAtDesc(user.getId()).ifPresent(latest -> {            long elapsedSeconds = ChronoUnit.SECONDS.between(latest.getCreatedAt(), Instant.now());
            if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
                throw new BusinessException(ErrorCode.OTP_RATE_LIMITED);
            }
        });

        sendOtp(user.getId(), email);
    }

    private String generateOtp() {
        int code = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(code);
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
