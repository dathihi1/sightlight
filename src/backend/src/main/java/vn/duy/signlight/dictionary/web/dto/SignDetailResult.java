package vn.duy.signlight.dictionary.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §2 endpoint 40 — chi tiết ký hiệu và các biến thể vùng miền (FR-22). */
public record SignDetailResult(
        UUID id,
        String word,
        String meaning,
        String wordClass,
        String topic,
        String description,
        boolean aiRecognizable,
        List<VariantItem> variants) {

    public record VariantItem(
            UUID id,
            String videoUrl,
            boolean placeholderVideo,
            String regionLabel,
            String signerLabel,
            boolean primary) {
    }
}
