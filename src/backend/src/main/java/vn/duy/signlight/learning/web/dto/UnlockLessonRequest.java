package vn.duy.signlight.learning.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

@Data
@EqualsAndHashCode(callSuper = true)
public class UnlockLessonRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Pattern(regexp = "^(RENT_1M|PERMANENT)$", message = "01101")
    @Schema(description = "Loại mở khóa: RENT_1M (thuê 1 tháng) hoặc PERMANENT (vĩnh viễn)", example = "RENT_1M")
    private String unlockType;
}
