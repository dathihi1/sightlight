package vn.duy.signlight.dictionary.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;
import vn.duy.signlight.dictionary.application.DictionaryService;
import vn.duy.signlight.dictionary.web.dto.DictionarySearchResult;
import vn.duy.signlight.dictionary.web.dto.SignDetailResult;

/** api-spec §3.10 và §2 endpoint 40–41 — từ điển ký hiệu. Công khai, có hạn mức. */
@RestController
@RequestMapping("/api/v1/dictionary")
@Tag(name = "dictionary")
@SecurityRequirements
@Validated
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm ký hiệu, hỗ trợ gõ không dấu (FR-21)")
    public ResponseEntity<TransactionResponse<DictionarySearchResult>> search(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam("q") @NotBlank(message = "00101") @Size(max = 100, message = "00101") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                ApiResponses.ok(requestId, dictionaryService.search(query, page, size)));
    }

    @GetMapping("/signs/{signId}")
    @Operation(summary = "Chi tiết ký hiệu và biến thể vùng miền (FR-22)")
    public ResponseEntity<TransactionResponse<SignDetailResult>> detail(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable UUID signId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId, dictionaryService.detail(signId)));
    }

    @GetMapping("/topics")
    @Operation(summary = "Danh sách chủ đề kèm số ký hiệu (FR-21)")
    public ResponseEntity<TransactionResponse<List<DictionaryService.TopicItem>>> topics(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        return ResponseEntity.ok(ApiResponses.ok(requestId, dictionaryService.topics()));
    }
}
