package vn.duy.signlight.notification.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.CurrentUser;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.notification.application.PushInstallationService;
import vn.duy.signlight.notification.web.dto.PushInstallationRequest;
import vn.duy.signlight.notification.web.dto.PushInstallationResult;

@RestController
@RequestMapping("/api/v1/push/installations")
@Tag(name = "push-notification")
public class PushInstallationController {

    private final PushInstallationService service;

    public PushInstallationController(PushInstallationService service) {
        this.service = service;
    }

    @PostMapping
    @Operation(summary = "Đăng ký Firebase Installation ID cho thiết bị hiện tại")
    public ResponseEntity<TransactionResponse<PushInstallationResult>> register(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @Valid @RequestBody PushInstallationRequest request) {
        PushInstallationService.RegistrationResult result =
                service.register(CurrentUser.id(), request.installationId().trim());
        return ResponseEntity.ok(ApiResponses.ok(
                requestId,
                new PushInstallationResult(result.enabled(), result.registered())));
    }

    @PostMapping("/revoke")
    @Operation(summary = "Gỡ Firebase Installation ID khi tắt push hoặc đăng xuất")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> revoke(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @Valid @RequestBody PushInstallationRequest request) {
        boolean revoked = service.revoke(CurrentUser.id(), request.installationId().trim());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("revoked", revoked)));
    }
}
