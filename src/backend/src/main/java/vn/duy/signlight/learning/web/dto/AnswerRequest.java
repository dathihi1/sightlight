package vn.duy.signlight.learning.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/**
 * api-spec §3.6 — nộp câu trả lời.
 *
 * <p>Không có trường `isCorrect`: client gửi lên cũng bị bỏ qua vì việc chấm nằm ở server (AC-12.3).
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AnswerRequest extends BaseRequest {

    @NotBlank(message = "03102")
    @Schema(example = "SIGN_TO_MEANING")
    private String answerType;

    @Schema(description = "Bắt buộc với các loại chọn đáp án")
    private UUID selectedOptionId;

    @Size(max = 200, message = "00101")
    @Schema(description = "Bắt buộc với TYPE_WHAT_YOU_SEE")
    private String typedAnswer;

    @Schema(description = "Bắt buộc với SENTENCE_ORDER")
    private List<String> orderedTokens;

    @Min(value = 0, message = "00101")
    @Max(value = 600000, message = "00101")
    @Schema(example = "4200", description = "Chỉ dùng cho thống kê")
    private Integer clientElapsedMs;
}
