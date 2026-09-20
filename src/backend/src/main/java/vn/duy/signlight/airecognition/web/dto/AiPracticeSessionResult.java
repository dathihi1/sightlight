package vn.duy.signlight.airecognition.web.dto;

import java.util.List;
import java.util.UUID;

/**
 * api-spec §2 endpoint 56d — phiên luyện ký hiệu động.
 *
 * <p>Chỉ gồm ký hiệu **có chấm AI** (BR-A111): không mời người học thử rồi trả kết quả vô nghĩa.
 */
public record AiPracticeSessionResult(
        UUID sessionId,
        String modelVersion,
        List<PracticeItem> items) {

    public record PracticeItem(
            UUID signId,
            String label,
            String topic,
            String videoUrl,
            boolean placeholderVideo) {
    }
}
