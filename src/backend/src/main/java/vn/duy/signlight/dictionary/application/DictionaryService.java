package vn.duy.signlight.dictionary.application;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.airecognition.application.AiRecognitionService;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.content.repository.SignRepository;
import vn.duy.signlight.content.repository.SignVideoRepository;
import vn.duy.signlight.dictionary.web.dto.DictionarySearchResult;
import vn.duy.signlight.dictionary.web.dto.SignDetailResult;

/**
 * Tra cứu từ điển ký hiệu (FR-21, FR-22).
 *
 * <p>Chỉ trả ký hiệu đã {@code PUBLISHED} (BR-A42). Mỗi kết quả kèm cờ {@code aiRecognizable} để
 * giao diện chỉ mời luyện AI với ký hiệu thật sự có chấm tự động (BR-A111).
 */
@Service
public class DictionaryService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SignRepository signRepository;
    private final SignVideoRepository signVideoRepository;
    private final ContentTreeService contentTree;
    private final MediaUrlService mediaUrlService;
    private final AiRecognitionService recognitionService;

    public DictionaryService(SignRepository signRepository,
            SignVideoRepository signVideoRepository,
            ContentTreeService contentTree,
            MediaUrlService mediaUrlService,
            AiRecognitionService recognitionService) {
        this.signRepository = signRepository;
        this.signVideoRepository = signVideoRepository;
        this.contentTree = contentTree;
        this.mediaUrlService = mediaUrlService;
        this.recognitionService = recognitionService;
    }

    @Transactional(readOnly = true)
    public DictionarySearchResult search(String query, int page, int size) {
        // api-spec §1: vượt cỡ trang tối đa thì ép về 50, không trả lỗi.
        int boundedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        Page<Sign> results = signRepository.search(query.trim(),
                PageRequest.of(Math.max(page, 0), boundedSize));

        Set<UUID> recognizable = recognitionService.recognizableSignIds();
        var videos = contentTree.primaryVideos(results.getContent().stream().map(Sign::getId).toList());

        List<DictionarySearchResult.SignItem> items = results.getContent().stream()
                .map(sign -> {
                    SignVideo video = videos.get(sign.getId());
                    return new DictionarySearchResult.SignItem(
                            sign.getId(),
                            sign.getWord(),
                            sign.getMeaning(),
                            sign.getTopic(),
                            sign.getWordClass(),
                            video == null ? null : mediaUrlService.signedUrl(video.getObjectKey()),
                            recognizable.contains(sign.getId()));
                })
                .toList();

        return new DictionarySearchResult(items, results.getTotalElements(), results.getTotalPages());
    }

    @Transactional(readOnly = true)
    public SignDetailResult detail(UUID signId) {
        Sign sign = contentTree.publishedSign(signId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTENT_NOT_PUBLISHED));

        List<SignDetailResult.VariantItem> variants = signVideoRepository.findBySignId(signId).stream()
                .map(video -> new SignDetailResult.VariantItem(
                        video.getId(),
                        mediaUrlService.signedUrl(video.getObjectKey()),
                        video.getObjectKey().startsWith("seed/"),
                        video.getRegionLabel(),
                        video.getSignerLabel(),
                        video.isPrimaryVariant()))
                .toList();

        return new SignDetailResult(
                sign.getId(),
                sign.getWord(),
                sign.getMeaning(),
                sign.getWordClass(),
                sign.getTopic(),
                sign.getDescription(),
                recognitionService.isRecognizable(signId),
                variants);
    }

    @Transactional(readOnly = true)
    public List<TopicItem> topics() {
        return signRepository.countByTopic().stream()
                .map(row -> new TopicItem(row.getTopic(), row.getTotal()))
                .toList();
    }

    /** Một chủ đề kèm số ký hiệu đã xuất bản. */
    public record TopicItem(String topic, long signCount) {
    }
}
