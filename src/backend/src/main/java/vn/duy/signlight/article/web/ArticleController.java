package vn.duy.signlight.article.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
@RequestMapping("/api/v1/articles")
@Tag(name = "articles", description = "Bài viết & Cẩm nang VSL (Public)")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách bài viết đã xuất bản (hỗ trợ lọc theo chuyên mục và tag)")
    public ResponseEntity<TransactionResponse<List<ArticleDtos.ArticleItem>>> listArticles(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "tag", required = false) String tag) {
        List<ArticleDtos.ArticleItem> items = articleService.listArticles(true, category, tag);
        return ResponseEntity.ok(ApiResponses.ok(requestId, items));
    }

    @GetMapping("/tags")
    @Operation(summary = "Lấy danh sách các tags kèm số lượng bài viết tương ứng")
    public ResponseEntity<TransactionResponse<List<ArticleDtos.TagInfo>>> listTags(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId) {
        List<ArticleDtos.TagInfo> tags = articleService.listAllTags(true);
        return ResponseEntity.ok(ApiResponses.ok(requestId, tags));
    }

    @GetMapping("/{idOrSlug}")
    @Operation(summary = "Lấy chi tiết bài viết theo ID hoặc slug")
    public ResponseEntity<TransactionResponse<ArticleDtos.ArticleItem>> getArticle(
            @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId,
            @PathVariable("idOrSlug") String idOrSlug) {
        ArticleDtos.ArticleItem item = articleService.getArticleByIdOrSlug(idOrSlug);
        return ResponseEntity.ok(ApiResponses.ok(requestId, item));
    }
}
