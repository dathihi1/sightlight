package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3 — dat lai mat khau bang token hop le (FR-04). */
@Data
@EqualsAndHashCode(callSuper = true)
public class ResetPasswordRequest extends BaseRequest {

    @NotBlank(message = "01107")
    @Schema(description = "Raw token nhan duoc qua email")
    private String token;

    /** 10-128 ky tu, bat buoc co ca chu va so (giong voi chinh sach dang ky). */
    @NotBlank(message = "01101")
    @Size(min = 10, max = 128, message = "01101")
    @Pattern(regexp = ".*[a-zA-Z].*", message = "01101")
    @Pattern(regexp = ".*[0-9].*", message = "01101")
    @Schema(example = "matKhauMoi2026")
    private String newPassword;
}
