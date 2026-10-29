package vn.duy.signlight.billing.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FeedbackRequest {

    @Schema(description = "Request ID phục vụ đối soát", example = "req-123456")
    private String requestId;

    @Min(1)
    @Max(5)
    @Schema(description = "Số sao đánh giá (1-5)", example = "5")
    private int rating = 5;

    @Schema(description = "Chủ đề / Phân loại góp ý", example = "AI_CAMERA")
    private String category = "GENERAL";

    @NotBlank
    @Schema(description = "Nội dung phản hồi / đóng góp ý kiến", example = "Camera AI nhận diện rất chuẩn, rất thích gói trải nghiệm!")
    private String content;
}
