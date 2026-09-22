package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3 — yeu cau dat lai mat khau (FR-04). */
@Data
@EqualsAndHashCode(callSuper = true)
public class ForgotPasswordRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Email(message = "01101")
    @Size(max = 254, message = "01101")
    @Schema(example = "hocvien01@example.com")
    private String email;
}
