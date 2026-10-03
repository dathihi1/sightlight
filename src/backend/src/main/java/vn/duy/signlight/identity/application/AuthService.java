package vn.duy.signlight.identity.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.domain.AuthIdentity;
import vn.duy.signlight.identity.domain.UserPreference;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.domain.UserStatus;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.AuthIdentityRepository;
import vn.duy.signlight.identity.repository.UserPreferenceRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.identity.web.dto.LoginRequest;
import vn.duy.signlight.identity.web.dto.LoginResult;
import vn.duy.signlight.identity.web.dto.MeResult;
import vn.duy.signlight.identity.web.dto.RegisterRequest;
import vn.duy.signlight.identity.web.dto.RegisterResult;

/** Đăng ký / đăng nhập / hồ sơ (FR-01, FR-02, FR-06). */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    public static final String ROLE_LEARNER_FREE = "LEARNER_FREE";
    public static final String ROLE_LEARNER_PREMIUM = "LEARNER_PREMIUM";
    public static final String ROLE_CONTENT_CREATOR = "CONTENT_CREATOR";
    public static final String ROLE_CONTENT_APPROVER = "CONTENT_APPROVER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_SUPPORT = "SUPPORT";

    private static final int MAX_FAILED_LOGINS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final String DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

    /**
     * Danh sách rút gọn phục vụ mã {@code 01102}. Bản đầy đủ (top 10k) sẽ nạp từ tệp ở lát sau —
     * ghi nhận là nợ kỹ thuật, không phải thiết kế cuối.
     */
    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password123", "123456789012", "qwerty123456", "matkhau123", "abcd12345678",
            "111111111111", "letmein12345", "admin1234567", "iloveyou1234", "signlight123");

    private final AppUserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPreferenceRepository preferenceRepository;
    private final ContentCatalogService contentCatalog;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthIdentityRepository authIdentityRepository;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final EmailVerificationService emailVerificationService;
    private final TokenService tokenService;

    public AuthService(AppUserRepository userRepository,
            UserProfileRepository profileRepository,
            UserPreferenceRepository preferenceRepository,
            ContentCatalogService contentCatalog,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthIdentityRepository authIdentityRepository,
            GoogleTokenVerifier googleTokenVerifier,
            EmailVerificationService emailVerificationService,
            TokenService tokenService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.preferenceRepository = preferenceRepository;
        this.contentCatalog = contentCatalog;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authIdentityRepository = authIdentityRepository;
        this.googleTokenVerifier = googleTokenVerifier;
        this.emailVerificationService = emailVerificationService;
        this.tokenService = tokenService;
    }

    // ------------------------------------------------------------------ đăng ký

    /**
     * Tạo tài khoản người học.
     *
     * <p><b>Chống dò tài khoản (NFR-08, AC-01.2):</b> email đã tồn tại trả về <i>đúng cấu trúc thành
     * công</i>, không có mã lỗi riêng. Ở nhánh đó ta vẫn băm mật khẩu (để thời gian phản hồi không
     * chênh quá 100 ms) và phát một access token gắn với UUID ngẫu nhiên <b>không tồn tại trong
     * CSDL</b> — kẻ dò không phân biệt được, còn tài khoản thật thì không bị đụng tới: mọi endpoint
     * đã xác thực đều tra người dùng và sẽ từ chối token đó.
     */
    @Transactional
    public RegisterResult register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(java.util.Locale.ROOT);
        if (COMMON_PASSWORDS.contains(request.getPassword().toLowerCase(java.util.Locale.ROOT))) {
            throw new BusinessException(ErrorCode.PASSWORD_TOO_COMMON);
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        UUID activeCourseId = contentCatalog.defaultCourseId().orElse(null);

        Optional<AppUser> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            log.info("register_duplicate_email_masked domain={}", maskedDomain(email));
            UUID decoyId = UUID.randomUUID();
            return new RegisterResult(decoyId,
                    jwtService.issueAccessToken(decoyId, List.of(ROLE_LEARNER_FREE)),
                    UUID.randomUUID().toString(),
                    UserStatus.PENDING_VERIFICATION.value(), activeCourseId);
        }

        Instant now = Instant.now();
        UUID userId = UUID.randomUUID();
        UUID referredByUserId = null;
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            String refCode = request.getReferralCode().trim().toUpperCase();
            Optional<AppUser> referrer = userRepository.findByReferralCode(refCode);
            if (referrer.isPresent() && !referrer.get().getEmail().equalsIgnoreCase(email)) {
                referredByUserId = referrer.get().getId();
                log.info("registration_referred_by userId={} referrerId={}", userId, referredByUserId);
            }
        }
        String myReferralCode = "SL" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        AppUser user = AppUser.builder()
                .id(userId)
                .email(email)
                .passwordHash(passwordHash)
                .status(UserStatus.PENDING_VERIFICATION.value())
                .failedLoginCount((short) 0)
                .birthYear(request.getBirthYear())
                .referralCode(myReferralCode)
                .referredByUserId(referredByUserId)
                .createdAt(now)
                .updatedAt(now)
                .roles(new java.util.LinkedHashSet<>(List.of(ROLE_LEARNER_FREE)))
                .build();
        userRepository.save(user);

        profileRepository.save(UserProfile.builder()
                .userId(userId)
                .displayName(request.getDisplayName().trim())
                .timezone(timezoneOrDefault(request.getTimezone()))
                .build());

        short goalMinutes = (request.getDailyGoalMinutes() != null && request.getDailyGoalMinutes() > 0)
                ? request.getDailyGoalMinutes()
                : (short) 10;
        preferenceRepository.save(UserPreference.builder()
                .userId(userId)
                .activeCourseId(activeCourseId)
                .dailyGoalMinutes(goalMinutes)
                .uiLocale("vi")
                .videoSpeed(new BigDecimal("1.00"))
                .marketingEmailOptIn(false)
                .build());

        emailVerificationService.sendOtp(userId, email);

        TokenService.TokenPair tokenPair = tokenService.issueTokenPair(userId, List.of(ROLE_LEARNER_FREE));
        return new RegisterResult(userId,
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                UserStatus.PENDING_VERIFICATION.value(), activeCourseId);
    }

    // ----------------------------------------------------------------- đăng nhập

    /** Sai email và sai mật khẩu trả về <b>cùng một mã</b> {@code 01201} (NFR-08). */
    @Transactional
    public LoginResult login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase(java.util.Locale.ROOT);
        Optional<AppUser> found = userRepository.findByEmailIgnoreCase(email);
        if (found.isEmpty()) {
            // Vẫn băm một lần để thời gian phản hồi không tố cáo email không tồn tại.
            passwordEncoder.encode(request.getPassword());
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }

        AppUser user = found.get();
        Instant now = Instant.now();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (UserStatus.SUSPENDED.value().equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            registerFailedAttempt(user, now);
            throw new BusinessException(ErrorCode.LOGIN_FAILED);
        }

        user.setFailedLoginCount((short) 0);
        user.setLockedUntil(null);
        user.setUpdatedAt(now);
        userRepository.save(user);

        UUID activeCourseId = preferenceRepository.findById(user.getId())
                .map(UserPreference::getActiveCourseId)
                .orElse(null);
        List<String> roles = List.copyOf(user.getRoles());
        TokenService.TokenPair tokenPair = tokenService.issueTokenPair(user.getId(), roles);

        return new LoginResult(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                user.getId(),
                roles,
                activeCourseId,
                user.getEmailVerifiedAt() == null,
                UserStatus.PENDING_DELETION.value().equals(user.getStatus()));
    }

    private void registerFailedAttempt(AppUser user, Instant now) {
        short failures = (short) (user.getFailedLoginCount() + 1);
        user.setFailedLoginCount(failures);
        if (failures >= MAX_FAILED_LOGINS) {
            user.setLockedUntil(now.plus(LOCK_MINUTES, ChronoUnit.MINUTES));
            user.setFailedLoginCount((short) 0);
        }
        user.setUpdatedAt(now);
        userRepository.save(user);
    }

    // ------------------------------------------------------------- google login

    @Transactional
    public LoginResult loginWithGoogle(String idToken) {
        return loginWithGoogle(idToken, null, null);
    }

    @Transactional
    public LoginResult loginWithGoogle(String idToken, String referralCode, Short dailyGoalMinutes) {
        GoogleTokenVerifier.GoogleUserPayload payload = googleTokenVerifier.verify(idToken);
        Instant now = Instant.now();

        Optional<AuthIdentity> existingIdentity = authIdentityRepository
                .findByProviderAndProviderUserId("GOOGLE", payload.sub());

        AppUser user;
        if (existingIdentity.isPresent()) {
            user = userRepository.findById(existingIdentity.get().getUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
        } else {
            Optional<AppUser> existingEmailUser = userRepository.findByEmailIgnoreCase(payload.email());
            if (existingEmailUser.isPresent()) {
                user = existingEmailUser.get();
                if (user.getEmailVerifiedAt() == null && payload.emailVerified()) {
                    user.setEmailVerifiedAt(now);
                }
            } else {
                UUID userId = UUID.randomUUID();
                UUID referredByUserId = null;
                if (referralCode != null && !referralCode.isBlank()) {
                    String refCode = referralCode.trim().toUpperCase();
                    Optional<AppUser> referrer = userRepository.findByReferralCode(refCode);
                    if (referrer.isPresent() && !referrer.get().getEmail().equalsIgnoreCase(payload.email())) {
                        referredByUserId = referrer.get().getId();
                        log.info("google_registration_referred_by userId={} referrerId={}", userId, referredByUserId);
                    }
                }
                String myReferralCode = "SL" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

                user = AppUser.builder()
                        .id(userId)
                        .email(payload.email())
                        .status(UserStatus.ACTIVE.value())
                        .emailVerifiedAt(payload.emailVerified() ? now : null)
                        .failedLoginCount((short) 0)
                        .referralCode(myReferralCode)
                        .referredByUserId(referredByUserId)
                        .createdAt(now)
                        .updatedAt(now)
                        .roles(new java.util.LinkedHashSet<>(List.of(ROLE_LEARNER_FREE)))
                        .build();
                userRepository.save(user);

                profileRepository.save(UserProfile.builder()
                        .userId(userId)
                        .displayName(payload.name() != null ? payload.name() : payload.email().split("@")[0])
                        .avatarObjectKey(payload.picture())
                        .timezone(DEFAULT_TIMEZONE)
                        .build());

                UUID activeCourseId = contentCatalog.defaultCourseId().orElse(null);
                short goal = (dailyGoalMinutes != null && dailyGoalMinutes > 0) ? dailyGoalMinutes : (short) 10;
                preferenceRepository.save(UserPreference.builder()
                        .userId(userId)
                        .activeCourseId(activeCourseId)
                        .dailyGoalMinutes(goal)
                        .uiLocale("vi")
                        .videoSpeed(new BigDecimal("1.00"))
                        .marketingEmailOptIn(false)
                        .build());
            }

            authIdentityRepository.save(AuthIdentity.builder()
                    .id(UUID.randomUUID())
                    .userId(user.getId())
                    .provider("GOOGLE")
                    .providerUserId(payload.sub())
                    .createdAt(now)
                    .build());
        }

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOCKED);
        }
        if (UserStatus.SUSPENDED.value().equals(user.getStatus())) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }

        user.setFailedLoginCount((short) 0);
        user.setLockedUntil(null);
        user.setUpdatedAt(now);
        userRepository.save(user);

        UUID activeCourseId = preferenceRepository.findById(user.getId())
                .map(UserPreference::getActiveCourseId)
                .orElse(null);
        List<String> roles = List.copyOf(user.getRoles());
        TokenService.TokenPair tokenPair = tokenService.issueTokenPair(user.getId(), roles);

        return new LoginResult(
                tokenPair.accessToken(),
                tokenPair.refreshToken(),
                user.getId(),
                roles,
                activeCourseId,
                user.getEmailVerifiedAt() == null,
                UserStatus.PENDING_DELETION.value().equals(user.getStatus()));
    }

    @Transactional
    public void upgradeToPremium(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.getRoles().add(ROLE_LEARNER_PREMIUM);
            user.setUpdatedAt(Instant.now());
            userRepository.save(user);
        });
    }

    // --------------------------------------------------------------------- hồ sơ

    @Transactional
    public MeResult me(UUID userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHENTICATED));
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        UserPreference preference = preferenceRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        // Tài khoản tạo lúc CSDL chưa có khoá học nào sẽ mang activeCourseId = null mãi mãi;
        // gán khoá mặc định ngay khi đã có để lộ trình học không bị kẹt.
        if (preference.getActiveCourseId() == null) {
            contentCatalog.defaultCourseId().ifPresent(courseId -> {
                preference.setActiveCourseId(courseId);
                preferenceRepository.save(preference);
            });
        }

        return new MeResult(
                userId,
                new MeResult.Profile(profile.getDisplayName(), user.getEmail(),
                        profile.getTimezone(), profile.getAvatarObjectKey()),
                new MeResult.Preferences(preference.getActiveCourseId(),
                        preference.getDailyGoalMinutes(),
                        preference.getVideoSpeed().toPlainString(),
                        preference.getUiLocale()),
                List.copyOf(user.getRoles()),
                user.getEmailVerifiedAt() != null);
    }

    /** Người dùng Premium không bị trừ hạn mức luyện AI (BR-A108). */
    @Transactional(readOnly = true)
    public boolean isPremium(UUID userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRoles().contains(ROLE_LEARNER_PREMIUM))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public String timezoneOf(UUID userId) {
        return profileRepository.findById(userId)
                .map(UserProfile::getTimezone)
                .orElse(DEFAULT_TIMEZONE);
    }

    private String timezoneOrDefault(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return DEFAULT_TIMEZONE;
        }
        try {
            return java.time.ZoneId.of(timezone).getId();
        } catch (java.time.DateTimeException ex) {
            return DEFAULT_TIMEZONE;
        }
    }

    // ------------------------------------------------------------------ refresh & logout

    public TokenService.TokenPair refreshToken(String rawRefreshToken) {
        return tokenService.rotateRefreshToken(rawRefreshToken);
    }

    public void logout(String rawRefreshToken) {
        tokenService.revokeToken(rawRefreshToken);
    }

    /** Log không bao giờ chứa email đầy đủ (BR-A90, NFR-13). */
    private String maskedDomain(String email) {
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at) : "unknown";
    }
}
