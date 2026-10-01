package vn.duy.signlight.advertising.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

@Data
@EqualsAndHashCode(callSuper = true)
public class ClaimAdRewardRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Pattern(regexp = "^(AI_QUOTA|EXP)$", message = "01101")
    @Schema(description = "Loại phần thưởng: AI_QUOTA (lượt camera AI) hoặc EXP (điểm kinh nghiệm)", example = "AI_QUOTA")
    private String rewardType;

    @Schema(description = "Vị trí xem quảng cáo", example = "CAMERA_MODAL")
    private String placement;
}
