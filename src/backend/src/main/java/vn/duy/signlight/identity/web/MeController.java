package vn.duy.signlight.identity.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.identity.application.AuthService;
import vn.duy.signlight.identity.web.dto.MeResult;

/** api-spec §2 endpoint 14 — hồ sơ người dùng đang đăng nhập (FR-06). */
@RestController
@RequestMapping("/api/v1/me")
@Tag(name = "identity")
public class MeController {

    private final AuthService authService;

    public MeController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Hồ sơ + quyền + tuỳ chọn của tôi")
    public ResponseEntity<TransactionResponse<MeResult>> me(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId, authService.me(CurrentUser.id())));
    }
}
