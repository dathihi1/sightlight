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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.admin.application.AdminQuestService;
import vn.duy.signlight.admin.web.dto.AdminQuestDtos;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin/quests")
@Tag(name = "admin-quests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestController {

    private final AdminQuestService adminQuestService;

    public AdminQuestController(AdminQuestService adminQuestService) {
        this.adminQuestService = adminQuestService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách nhiệm vụ hệ thống")
    public ResponseEntity<TransactionResponse<List<AdminQuestDtos.QuestItem>>> listQuests(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<AdminQuestDtos.QuestItem> result = adminQuestService.listAllQuests();
        return ResponseEntity.ok(ApiResponses.ok(requestId, result));
    }

    @PostMapping
    @Operation(summary = "Tạo mới nhiệm vụ")
    public ResponseEntity<TransactionResponse<Map<String, UUID>>> createQuest(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestBody AdminQuestDtos.QuestUpsertRequest request) {
        UUID id = adminQuestService.createQuest(request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("questId", id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin nhiệm vụ")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateQuest(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id,
            @RequestBody AdminQuestDtos.QuestUpsertRequest request) {
        adminQuestService.updateQuest(id, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Bật hoặc tắt trạng thái kích hoạt nhiệm vụ")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> toggleActive(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        boolean active = adminQuestService.toggleActive(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("active", active)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa nhiệm vụ")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> deleteQuest(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        adminQuestService.deleteQuest(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }
}
