package vn.duy.signlight.admin.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.admin.application.AdminUserService;
import vn.duy.signlight.admin.web.dto.AdminUserDtos;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "admin-users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "Danh sách người dùng, tìm kiếm theo email và phân trang")
    public ResponseEntity<TransactionResponse<AdminUserDtos.UserListResult>> listUsers(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        AdminUserDtos.UserListResult result = adminUserService.listUsers(search, status, page, size);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Xem chi tiết thông tin, hồ sơ, streak và gói cước người dùng")
    public ResponseEntity<TransactionResponse<AdminUserDtos.UserDetailResult>> getUserDetail(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("userId") UUID userId) {
        AdminUserDtos.UserDetailResult result = adminUserService.getUserDetail(userId);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PatchMapping("/{userId}/status")
    @Operation(summary = "Cập nhật trạng thái người dùng (ACTIVE, LOCKED, SUSPENDED)")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateStatus(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("userId") UUID userId,
            @RequestBody AdminUserDtos.UpdateStatusRequest req) {
        adminUserService.updateStatus(userId, req.status());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PutMapping("/{userId}/roles")
    @Operation(summary = "Cập nhật danh sách vai trò của người dùng")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateRoles(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("userId") UUID userId,
            @RequestBody AdminUserDtos.UpdateRolesRequest req) {
        adminUserService.updateRoles(userId, req.roles());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PostMapping("/{userId}/adjust-balance")
    @Operation(summary = "Cộng hoặc trừ EXP / Lượt AI của người dùng và gửi thông báo")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> adjustBalance(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("userId") UUID userId,
            @RequestBody AdminUserDtos.AdjustBalanceRequest req) {
        adminUserService.adjustBalance(userId, req.expDelta(), req.aiQuotaDelta(), req.reason());
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }
}
