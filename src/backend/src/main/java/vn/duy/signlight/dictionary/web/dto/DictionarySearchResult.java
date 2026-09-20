package vn.duy.signlight.dictionary.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §3.10 — tìm kiếm ký hiệu (FR-21). */
public record DictionarySearchResult(
        List<SignItem> items,
        long totalElements,
        int totalPages) {

    public record SignItem(
            UUID id,
            String word,
            String meaning,
            String topic,
            String wordClass,
            String thumbnailUrl,
            boolean aiRecognizable) {
    }
}
