package vn.duy.signlight.identity.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.web.dto.LoginRequest;
import vn.duy.signlight.identity.web.dto.LoginResult;
import vn.duy.signlight.identity.web.dto.RegisterRequest;
import vn.duy.signlight.identity.web.dto.RegisterResult;

/** api-spec §3.1–3.2 — đăng ký và đăng nhập. Công khai. */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "identity")
@SecurityRequirements
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản (FR-01)")
    public ResponseEntity<TransactionResponse<RegisterResult>> register(
            @Valid @RequestBody RegisterRequest request) {
        RegisterResult result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponses.ok(request.getRequestId(), result));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập (FR-02)")
    public ResponseEntity<TransactionResponse<LoginResult>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResult result = authService.login(request);
        return ResponseEntity.ok(ApiResponses.ok(request.getRequestId(), result));
    }
}
