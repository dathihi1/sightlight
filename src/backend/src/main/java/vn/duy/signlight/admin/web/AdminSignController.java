package vn.duy.signlight.admin.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.admin.application.AdminSignService;
import vn.duy.signlight.admin.web.dto.AdminSignDtos;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin/signs")
@Tag(name = "admin-signs", description = "Quản lý kho Video học và Định nghĩa ký hiệu VSL")
@PreAuthorize("hasAnyRole('ADMIN', 'CONTENT_CREATOR', 'CONTENT_APPROVER')")
public class AdminSignController {

    private final AdminSignService adminSignService;

    public AdminSignController(AdminSignService adminSignService) {
        this.adminSignService = adminSignService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách video học và định nghĩa ký hiệu kèm phân trang & tìm kiếm")
    public ResponseEntity<TransactionResponse<AdminSignDtos.AdminSignListResponse>> getSigns(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "15") int size) {
        AdminSignDtos.AdminSignListResponse result = adminSignService.getSignList(search, topic, page, size);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/topics")
    @Operation(summary = "Lấy danh sách các chủ đề từ ký hiệu")
    public ResponseEntity<TransactionResponse<List<String>>> getTopics(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<String> result = adminSignService.getTopics();
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết 1 video học & định nghĩa ký hiệu")
    public ResponseEntity<TransactionResponse<AdminSignDtos.AdminSignItemDto>> getSignDetail(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        AdminSignDtos.AdminSignItemDto result = adminSignService.getSignDetail(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping
    @Operation(summary = "Tạo mới một từ ký hiệu và video học đi kèm")
    public ResponseEntity<TransactionResponse<Map<String, UUID>>> createSign(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestBody AdminSignDtos.AdminSignUpsertRequest request) {
        UUID createdId = adminSignService.createSign(request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("signId", createdId)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật định nghĩa, thông tin và video của từ ký hiệu")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateSign(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id,
            @RequestBody AdminSignDtos.AdminSignUpsertRequest request) {
        adminSignService.updateSign(id, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa một từ ký hiệu và video liên quan")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> deleteSign(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        adminSignService.deleteSign(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }
}
