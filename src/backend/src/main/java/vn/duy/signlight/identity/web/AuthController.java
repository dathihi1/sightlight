package vn.duy.signlight.identity.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.application.EmailVerificationService;
import vn.duy.signlight.identity.application.PasswordResetService;
import vn.duy.signlight.identity.application.TokenService;
import vn.duy.signlight.identity.web.dto.ForgotPasswordRequest;
import vn.duy.signlight.identity.web.dto.GoogleLoginRequest;
import vn.duy.signlight.identity.web.dto.LoginRequest;
import vn.duy.signlight.identity.web.dto.LoginResult;
import vn.duy.signlight.identity.web.dto.RegisterRequest;
import vn.duy.signlight.identity.web.dto.RegisterResult;
import vn.duy.signlight.identity.web.dto.ResendOtpRequest;
import vn.duy.signlight.identity.web.dto.ResetPasswordRequest;
import vn.duy.signlight.identity.web.dto.TokenRefreshRequest;
import vn.duy.signlight.identity.web.dto.TokenRefreshResult;
import vn.duy.signlight.identity.web.dto.VerifyEmailRequest;

/** api-spec §3.1-3.6, §3.20 — dang ky, dang nhap, xac nhan email, dat lai mat khau, refresh token, logout. */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "identity")
@SecurityRequirements
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final long REFRESH_TOKEN_COOKIE_MAX_AGE = 30L * 24 * 3600;

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final boolean cookieSecure;

    public AuthController(
            AuthService authService,
            EmailVerificationService emailVerificationService,
            PasswordResetService passwordResetService,
            @Value("${signlight.security.jwt.cookie-secure:false}") boolean cookieSecure) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
        this.passwordResetService = passwordResetService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/register")
    @Operation(summary = "Dang ky tai khoan (FR-01)")
    public ResponseEntity<TransactionResponse<RegisterResult>> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResult result = authService.register(request);
        var responseBuilder = ResponseEntity.status(HttpStatus.CREATED);
        if (result.refreshToken() != null && !result.refreshToken().isBlank()) {
            responseBuilder.header(HttpHeaders.SET_COOKIE,
                    buildRefreshTokenCookie(result.refreshToken(), REFRESH_TOKEN_COOKIE_MAX_AGE).toString());
        }
        return responseBuilder.body(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/login")
    @Operation(summary = "Dang nhap (FR-02)")
    public ResponseEntity<TransactionResponse<LoginResult>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);
        var responseBuilder = ResponseEntity.ok();
        if (result.refreshToken() != null && !result.refreshToken().isBlank()) {
            responseBuilder.header(HttpHeaders.SET_COOKIE,
                    buildRefreshTokenCookie(result.refreshToken(), REFRESH_TOKEN_COOKIE_MAX_AGE).toString());
        }
        return responseBuilder.body(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/google")
    @Operation(summary = "Dang nhap hoac dang ky bang Google OAuth2/OIDC (FR-03)")
    public ResponseEntity<TransactionResponse<LoginResult>> loginWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request) {
        LoginResult result = authService.loginWithGoogle(request.getIdToken());
        var responseBuilder = ResponseEntity.ok();
        if (result.refreshToken() != null && !result.refreshToken().isBlank()) {
            responseBuilder.header(HttpHeaders.SET_COOKIE,
                    buildRefreshTokenCookie(result.refreshToken(), REFRESH_TOKEN_COOKIE_MAX_AGE).toString());
        }
        return responseBuilder.body(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/email/verify")
    @Operation(summary = "Xac nhan email bang OTP (FR-01b)")
    public ResponseEntity<TransactionResponse<LoginResult>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request) {
        LoginResult result = emailVerificationService.verifyOtp(request.getEmail(), request.getOtp());
        var responseBuilder = ResponseEntity.ok();
        if (result.refreshToken() != null && !result.refreshToken().isBlank()) {
            responseBuilder.header(HttpHeaders.SET_COOKIE,
                    buildRefreshTokenCookie(result.refreshToken(), REFRESH_TOKEN_COOKIE_MAX_AGE).toString());
        }
        return responseBuilder.body(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/email/resend")
    @Operation(summary = "Gui lai OTP xac nhan email")
    public ResponseEntity<TransactionResponse<Void>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request) {
        emailVerificationService.resendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), null));
    }

    @PostMapping("/password/forgot")
    @Operation(summary = "Yeu cau dat lai mat khau (FR-04)")
    public ResponseEntity<TransactionResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), null));
    }

    @PostMapping("/password/reset")
    @Operation(summary = "Dat lai mat khau bang token (FR-04)")
    public ResponseEntity<TransactionResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), null));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Lam moi access token bang refresh token xoay vong (BR-A04, api-spec §3.20)")
    public ResponseEntity<TransactionResponse<TokenRefreshResult>> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieRefreshToken,
            @RequestBody(required = false) TokenRefreshRequest request) {

        String tokenToRotate = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken.trim()
                : (request != null && request.getRefreshToken() != null ? request.getRefreshToken().trim() : null);

        if (tokenToRotate == null || tokenToRotate.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHENTICATED);
        }

        TokenService.TokenPair newPair = authService.refreshToken(tokenToRotate);
        String reqId = request != null ? request.getRequestId() : null;

        ResponseCookie newCookie = buildRefreshTokenCookie(newPair.refreshToken(), REFRESH_TOKEN_COOKIE_MAX_AGE);
        TokenRefreshResult result = new TokenRefreshResult(
                newPair.accessToken(),
                newPair.refreshToken(),
                newPair.expiresInSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, newCookie.toString())
                .body(ApiResponses.ok(reqId, result));
    }

    @PostMapping("/logout")
    @Operation(summary = "Dang xuat va thu hoi phien (FR-02, api-spec §3.20)")
    public ResponseEntity<TransactionResponse<Void>> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String cookieRefreshToken,
            @RequestBody(required = false) TokenRefreshRequest request) {

        String tokenToRevoke = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken.trim()
                : (request != null && request.getRefreshToken() != null ? request.getRefreshToken().trim() : null);

        if (tokenToRevoke != null && !tokenToRevoke.isBlank()) {
            authService.logout(tokenToRevoke);
        }

        ResponseCookie clearCookie = buildRefreshTokenCookie("", 0);
        String reqId = request != null ? request.getRequestId() : null;

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(ApiResponses.ok(reqId, null));
    }

    private ResponseCookie buildRefreshTokenCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .sameSite("Lax")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
