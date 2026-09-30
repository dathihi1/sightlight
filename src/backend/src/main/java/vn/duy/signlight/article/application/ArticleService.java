package vn.duy.signlight.article.application;

import jakarta.annotation.PostConstruct;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.article.domain.Article;
import vn.duy.signlight.article.repository.ArticleRepository;
import vn.duy.signlight.article.web.dto.ArticleDtos;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;

@Service
public class ArticleService {

    private static final Logger log = LoggerFactory.getLogger(ArticleService.class);
    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @Transactional(readOnly = true)
    public List<ArticleDtos.ArticleItem> listArticles(boolean onlyPublished, String category, String tag) {
        List<Article> all = onlyPublished
                ? articleRepository.findAllByPublishedTrueOrderByCreatedAtDesc()
                : articleRepository.findAllByOrderByCreatedAtDesc();

        return all.stream()
                .filter(a -> category == null || category.isBlank() || category.equalsIgnoreCase("all") || category.equalsIgnoreCase(a.getCategory()))
                .filter(a -> {
                    if (tag == null || tag.isBlank()) return true;
                    List<String> tags = parseTags(a.getTags());
                    return tags.stream().anyMatch(t -> t.equalsIgnoreCase(tag.trim()));
                })
                .map(this::mapToItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public ArticleDtos.ArticleItem getArticleByIdOrSlug(String idOrSlug) {
        Article article = null;
        try {
            UUID id = UUID.fromString(idOrSlug);
            article = articleRepository.findById(id).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, lookup by slug
        }

        if (article == null) {
            article = articleRepository.findBySlug(idOrSlug)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        }

        return mapToItem(article);
    }

    @Transactional
    public UUID createArticle(ArticleDtos.ArticleUpsertRequest request) {
        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = slugify(request.getTitleVi() != null ? request.getTitleVi() : "bai-viet");
        }
        slug = slug.toLowerCase().trim();

        if (articleRepository.existsBySlug(slug)) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }

        String tagsStr = joinTags(request.getTags());

        Article article = Article.builder()
                .id(UUID.randomUUID())
                .slug(slug)
                .titleVi(request.getTitleVi())
                .titleEn(request.getTitleEn())
                .excerptVi(request.getExcerptVi())
                .excerptEn(request.getExcerptEn())
                .contentVi(request.getContentVi())
                .contentEn(request.getContentEn())
                .author(request.getAuthor() != null && !request.getAuthor().isBlank() ? request.getAuthor() : "SignLight Team")
                .category(request.getCategory() != null ? request.getCategory() : "tips")
                .categoryLabelVi(request.getCategoryLabelVi() != null ? request.getCategoryLabelVi() : "Mẹo học tập")
                .categoryLabelEn(request.getCategoryLabelEn() != null ? request.getCategoryLabelEn() : "Learning Tips")
                .tags(tagsStr)
                .thumbnailUrl(request.getThumbnailUrl())
                .readTimeVi(request.getReadTimeVi() != null ? request.getReadTimeVi() : "5 phút đọc")
                .readTimeEn(request.getReadTimeEn() != null ? request.getReadTimeEn() : "5 min read")
                .published(request.getPublished() != null ? request.getPublished() : true)
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .createdAt(Instant.now())
                .build();

        article = articleRepository.save(article);
        log.info("article_created id={} slug={}", article.getId(), article.getSlug());
        return article.getId();
    }

    @Transactional
    public void updateArticle(UUID id, ArticleDtos.ArticleUpsertRequest request) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            String newSlug = request.getSlug().toLowerCase().trim();
            if (articleRepository.existsBySlugAndIdNot(newSlug, id)) {
                throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
            }
            article.setSlug(newSlug);
        }

        if (request.getTitleVi() != null) article.setTitleVi(request.getTitleVi());
        if (request.getTitleEn() != null) article.setTitleEn(request.getTitleEn());
        if (request.getExcerptVi() != null) article.setExcerptVi(request.getExcerptVi());
        if (request.getExcerptEn() != null) article.setExcerptEn(request.getExcerptEn());
        if (request.getContentVi() != null) article.setContentVi(request.getContentVi());
        if (request.getContentEn() != null) article.setContentEn(request.getContentEn());
        if (request.getAuthor() != null) article.setAuthor(request.getAuthor());
        if (request.getCategory() != null) article.setCategory(request.getCategory());
        if (request.getCategoryLabelVi() != null) article.setCategoryLabelVi(request.getCategoryLabelVi());
        if (request.getCategoryLabelEn() != null) article.setCategoryLabelEn(request.getCategoryLabelEn());
        if (request.getTags() != null) article.setTags(joinTags(request.getTags()));
        if (request.getThumbnailUrl() != null) article.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getReadTimeVi() != null) article.setReadTimeVi(request.getReadTimeVi());
        if (request.getReadTimeEn() != null) article.setReadTimeEn(request.getReadTimeEn());
        if (request.getPublished() != null) article.setPublished(request.getPublished());
        if (request.getOrderIndex() != null) article.setOrderIndex(request.getOrderIndex());
        article.setUpdatedAt(Instant.now());

        articleRepository.save(article);
        log.info("article_updated id={} slug={}", article.getId(), article.getSlug());
    }

    @Transactional
    public boolean togglePublished(UUID id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        article.setPublished(!article.isPublished());
        article.setUpdatedAt(Instant.now());
        articleRepository.save(article);
        return article.isPublished();
    }

    @Transactional
    public void deleteArticle(UUID id) {
        if (!articleRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        articleRepository.deleteById(id);
        log.info("article_deleted id={}", id);
    }

    @Transactional(readOnly = true)
    public List<ArticleDtos.TagInfo> listAllTags(boolean onlyPublished) {
        List<Article> articles = onlyPublished
                ? articleRepository.findAllByPublishedTrueOrderByCreatedAtDesc()
                : articleRepository.findAllByOrderByCreatedAtDesc();

        Map<String, Long> tagCounts = new HashMap<>();
        for (Article a : articles) {
            List<String> tags = parseTags(a.getTags());
            for (String t : tags) {
                if (!t.isBlank()) {
                    tagCounts.put(t, tagCounts.getOrDefault(t, 0L) + 1);
                }
            }
        }

        return tagCounts.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
                .map(e -> new ArticleDtos.TagInfo(e.getKey(), e.getValue()))
                .toList();
    }

    private ArticleDtos.ArticleItem mapToItem(Article a) {
        return ArticleDtos.ArticleItem.builder()
                .id(a.getId())
                .slug(a.getSlug())
                .titleVi(a.getTitleVi())
                .titleEn(a.getTitleEn())
                .excerptVi(a.getExcerptVi())
                .excerptEn(a.getExcerptEn())
                .contentVi(a.getContentVi())
                .contentEn(a.getContentEn())
                .author(a.getAuthor())
                .category(a.getCategory())
                .categoryLabelVi(a.getCategoryLabelVi())
                .categoryLabelEn(a.getCategoryLabelEn())
                .tags(parseTags(a.getTags()))
                .thumbnailUrl(a.getThumbnailUrl())
                .readTimeVi(a.getReadTimeVi())
                .readTimeEn(a.getReadTimeEn())
                .published(a.isPublished())
                .viewsCount(a.getViewsCount())
                .orderIndex(a.getOrderIndex())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private List<String> parseTags(String tagsStr) {
        if (tagsStr == null || tagsStr.isBlank()) return Collections.emptyList();
        return Arrays.stream(tagsStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private String joinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) return "";
        return String.join(", ", tags.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
    }

    private String slugify(String input) {
        String nowhitespace = input.trim().replaceAll("\\s+", "-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("[^a-z0-9-]", "");
    }

    @PostConstruct
    public void seedInitialArticles() {
        if (articleRepository.count() > 0) {
            return;
        }
        log.info("seeding_initial_blog_articles...");

        List<Article> seeds = new ArrayList<>();

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("5-reasons-learn-vsl")
                .titleVi("5 Lý do bạn nên bắt đầu học Ngôn ngữ Ký hiệu Việt Nam (VSL) ngay hôm nay")
                .titleEn("5 Reasons Why You Should Start Learning Vietnamese Sign Language (VSL) Today")
                .excerptVi("Học VSL không chỉ giúp bạn giao tiếp với hơn 2,5 triệu người Điếc mà còn phát triển tư duy không gian thị giác và nuôi dưỡng lòng thấu cảm sâu sắc.")
                .excerptEn("Learning VSL enables you to connect with 2.5M Deaf citizens while boosting spatial-visual cognition and cultivating deep empathy.")
                .contentVi("Ngôn ngữ Ký hiệu Việt Nam (VSL) không đơn thuần là cử chỉ tay, mà là một ngôn ngữ hoàn chỉnh với ngữ pháp không gian và bản sắc riêng. 1) Kết nối cộng đồng; 2) Rèn luyện phản xạ não bộ; 3) Tự tin giao tiếp; 4) Mở rộng cơ hội nghề nghiệp; 5) Đồng hành xây dựng xã hội hoà nhập.")
                .author("Đội ngũ Giáo dục SignLight")
                .category("tips")
                .categoryLabelVi("Mẹo học tập")
                .categoryLabelEn("Learning Tips")
                .tags("VSL, Mẹo học, Giao tiếp, Nhập môn")
                .readTimeVi("4 phút đọc")
                .readTimeEn("4 min read")
                .published(true)
                .orderIndex(1)
                .createdAt(Instant.now().minusSeconds(86400 * 15))
                .build());

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("deaf-culture-vietnam")
                .titleVi("Hiểu đúng về Văn hoá Người Điếc: Điếc không phải khiếm khuyết mà là một bản sắc")
                .titleEn("Deaf Culture in Vietnam: Deafness as a Linguistic Identity, Not a Disability")
                .excerptVi("Người Điếc có ngôn ngữ riêng, di sản văn hoá phong phú và niềm tự hào cộng đồng mạnh mẽ. Tìm hiểu các quy tắc ứng xử tôn trọng khi giao tiếp.")
                .excerptEn("The Deaf community shares a rich linguistic heritage and proud identity. Explore essential etiquette when engaging with Deaf individuals.")
                .contentVi("Văn hoá Người Điếc được xây dựng dựa trên giao tiếp thị giác. Khi nói chuyện, hãy duy trì tiếp xúc bằng mắt, vẫy tay nhẹ hoặc chạm vai nhẹ để thu hút sự chú ý. Tôn trọng VSL là tôn trọng bản sắc con người.")
                .author("Nguyễn Minh Tuấn (Giáo viên VSL)")
                .category("culture")
                .categoryLabelVi("Văn hoá Người Điếc")
                .categoryLabelEn("Deaf Culture")
                .tags("Văn hoá, Bản sắc, Tôn trọng, Cộng đồng")
                .readTimeVi("6 phút đọc")
                .readTimeEn("6 min read")
                .published(true)
                .orderIndex(2)
                .createdAt(Instant.now().minusSeconds(86400 * 20))
                .build());

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("ai-gesture-recognition")
                .titleVi("Công nghệ AI nhận diện cử chỉ động qua webcam tại trình duyệt hoạt động ra sao?")
                .titleEn("How Browser-based AI Gesture Recognition Analyzes Dynamic Signs in Real-Time")
                .excerptVi("Tìm hiểu cách MediaPipe trích xuất 63 điểm mốc bàn tay kết hợp kiến trúc Lite-Transformer phân tích chuỗi chuyển động với độ trễ dưới 50ms.")
                .excerptEn("Explore how MediaPipe landmark extraction couples with Lite-Transformer to classify dynamic signing sequences in under 50ms with zero server uploads.")
                .contentVi("Mô hình AI nhận diện của SignLight kết hợp MediaPipe Hands để trích xuất toạ độ 3D và Lite-Transformer ONNX tối ưu hoá chạy trực tiếp bằng WebAssembly trong trình duyệt. Không cần truyền video lên máy chủ, bảo mật tuyệt đối cho người học.")
                .author("SignLight AI Lab")
                .category("tech")
                .categoryLabelVi("Công nghệ AI")
                .categoryLabelEn("AI Technology")
                .tags("AI, Machine Learning, MediaPipe, WebAssembly, Thị giác máy tính")
                .readTimeVi("8 phút đọc")
                .readTimeEn("8 min read")
                .published(true)
                .orderIndex(3)
                .createdAt(Instant.now().minusSeconds(86400 * 25))
                .build());

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("vsl-finger-spelling")
                .titleVi("Bảng chữ cái ngón tay VSL: Hướng dẫn nhập môn từng bước cho người mới")
                .titleEn("VSL Fingerspelling: Step-by-Step Starter Guide for Beginners")
                .excerptVi("Bảng chữ cái ngón tay là viên gạch nền tảng giúp bạn đánh vần tên riêng, địa danh và từ mới khi chưa biết ký hiệu tương ứng.")
                .excerptEn("Fingerspelling is the fundamental building block for spelling names, locations, and loan words in Vietnamese Sign Language.")
                .contentVi("Bảng chữ cái ngón tay VSL gồm các hình thái bàn tay tương ứng với chữ cái tiếng Việt. Khi đánh vần, giữ bàn tay ở độ cao ngang ngực, hướng về phía người đối diện và giữ nhịp điệu đều đặn.")
                .author("Trần Mai Anh (Nghiên cứu VSL)")
                .category("tips")
                .categoryLabelVi("Mẹo học tập")
                .categoryLabelEn("Learning Tips")
                .tags("Chữ cái ngón tay, VSL, Cơ bản, Bảng chữ cái")
                .readTimeVi("5 phút đọc")
                .readTimeEn("5 min read")
                .published(true)
                .orderIndex(4)
                .createdAt(Instant.now().minusSeconds(86400 * 30))
                .build());

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("regional-vsl-differences")
                .titleVi("Sự khác biệt thú vị giữa Ngôn ngữ Ký hiệu Miền Bắc, Miền Trung và Miền Nam")
                .titleEn("Fascinating Regional Variations Across Northern, Central, and Southern VSL")
                .excerptVi("Cũng như phương ngữ tiếng nói, VSL tại Hà Nội, Đà Nẵng và TP.HCM có những nét biến thể cử chỉ thú vị phản ánh đời sống văn hoá từng vùng miền.")
                .excerptEn("Just like spoken dialects, VSL signs in Hanoi, Da Nang, and Ho Chi Minh City feature rich regional variations shaped by local history.")
                .contentVi("Dù có các biến thể vùng miền, cộng đồng người Điếc Việt Nam có khả năng thích nghi và thấu hiểu lẫn nhau rất nhanh. SignLight chuẩn hoá các ký hiệu phổ thông nhất đồng thời ghi chú các nét đặc trưng vùng miền.")
                .author("Đội ngũ Giáo dục SignLight")
                .category("culture")
                .categoryLabelVi("Văn hoá Người Điếc")
                .categoryLabelEn("Deaf Culture")
                .tags("Văn hoá, Phương ngữ, Vùng miền, VSL")
                .readTimeVi("7 phút đọc")
                .readTimeEn("7 min read")
                .published(true)
                .orderIndex(5)
                .createdAt(Instant.now().minusSeconds(86400 * 35))
                .build());

        seeds.add(Article.builder()
                .id(UUID.randomUUID())
                .slug("inclusive-workplace-vsl")
                .titleVi("Xây dựng nơi làm việc hoà nhập: Bài học từ các doanh nghiệp tiên phong")
                .titleEn("Building an Accessible Workplace: Practical Lessons from Inclusive Employers")
                .excerptVi("Tại sao việc trang bị kỹ năng ký hiệu cơ bản cho bộ phận nhân sự và chăm sóc khách hàng lại giúp gia tăng 40% chỉ số gắn kết của đội ngũ.")
                .excerptEn("Why training HR and frontline customer service teams in basic signs improves organizational empathy and employee retention by up to 40%.")
                .contentVi("Một môi trường làm việc bình đẳng không chỉ là tuyển dụng mà còn là cung cấp các công cụ giao tiếp. Các khoá đào tạo VSL doanh nghiệp của SignLight giúp các phòng ban gắn kết và thấu hiểu hơn.")
                .author("SignLight Enterprise")
                .category("community")
                .categoryLabelVi("Cộng đồng & Xã hội")
                .categoryLabelEn("Community")
                .tags("Doanh nghiệp, Hoà nhập, Xã hội, Đào tạo")
                .readTimeVi("5 phút đọc")
                .readTimeEn("5 min read")
                .published(true)
                .orderIndex(6)
                .createdAt(Instant.now().minusSeconds(86400 * 40))
                .build());

        articleRepository.saveAll(seeds);
        log.info("seeded_initial_articles count={}", seeds.size());
    }
}
