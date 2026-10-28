package vn.duy.signlight.admin.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.admin.application.AdminDashboardService;
import vn.duy.signlight.admin.web.dto.AdminDashboardStatsDto;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@Tag(name = "admin-dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Lấy dữ liệu thống kê tổng hợp cho Admin Dashboard")
    public ResponseEntity<TransactionResponse<AdminDashboardStatsDto>> getStats(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AdminDashboardStatsDto stats = dashboardService.getStats(from, to);
        return ResponseEntity.ok(ApiResponses.ok(requestId, stats));
    }
}
