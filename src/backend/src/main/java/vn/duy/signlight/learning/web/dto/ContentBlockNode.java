package vn.duy.signlight.learning.web.dto;

import java.util.UUID;

/**
 * DTO cho lesson content block (public API).
 *
 * <p>Chỉ chứa dữ liệu an toàn để trả về client.
 * Không bao giờ chứa đáp án hoặc logic chấm điểm.
 */
public record ContentBlockNode(
        UUID id,
        String stableKey,
        String blockType,
        String title,
        String bodyText,
        Object payload,
        UUID signId,
        String mediaRef,
        boolean required) {
}
