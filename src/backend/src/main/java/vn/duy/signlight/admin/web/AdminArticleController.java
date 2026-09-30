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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.article.application.ArticleService;
import vn.duy.signlight.article.web.dto.ArticleDtos;
import vn.duy.signlight.common.error.ApiResponses;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

@RestController
@RequestMapping("/api/v1/admin/articles")
@Tag(name = "admin-articles", description = "Quản trị bài viết & Tags (Admin)")
@PreAuthorize("hasRole('ADMIN')")
public class AdminArticleController {

    private final ArticleService articleService;

    public AdminArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ bài viết quản trị (bao gồm cả nháp, lọc theo category, tag)")
    public ResponseEntity<TransactionResponse<List<ArticleDtos.ArticleItem>>> listArticles(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tag", required = false) String tag) {
        List<ArticleDtos.ArticleItem> items = articleService.listArticles(false, category, tag);
        return ResponseEntity.ok(ApiResponses.ok(requestId, items));
    }

    @GetMapping("/tags")
    @Operation(summary = "Lấy toàn bộ danh sách tags và số lượng bài viết tương ứng")
    public ResponseEntity<TransactionResponse<List<ArticleDtos.TagInfo>>> listTags(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<ArticleDtos.TagInfo> tags = articleService.listAllTags(false);
        return ResponseEntity.ok(ApiResponses.ok(requestId, tags));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một bài viết")
    public ResponseEntity<TransactionResponse<ArticleDtos.ArticleItem>> getArticle(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") String id) {
        ArticleDtos.ArticleItem item = articleService.getArticleByIdOrSlug(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, item));
    }

    @PostMapping
    @Operation(summary = "Tạo mới bài viết")
    public ResponseEntity<TransactionResponse<Map<String, UUID>>> createArticle(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestBody ArticleDtos.ArticleUpsertRequest request) {
        UUID id = articleService.createArticle(request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("articleId", id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật bài viết")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> updateArticle(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id,
            @RequestBody ArticleDtos.ArticleUpsertRequest request) {
        articleService.updateArticle(id, request);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }

    @PatchMapping("/{id}/toggle-published")
    @Operation(summary = "Bật/tắt trạng thái xuất bản bài viết")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> togglePublished(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        boolean published = articleService.togglePublished(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("published", published)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xoá bài viết")
    public ResponseEntity<TransactionResponse<Map<String, Boolean>>> deleteArticle(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("id") UUID id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponses.ok(requestId, Map.of("success", true)));
    }
}
