package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3 — xac nhan email bang OTP (FR-01b). */
@Data
@EqualsAndHashCode(callSuper = true)
public class VerifyEmailRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Email(message = "01101")
    @Size(max = 254, message = "01101")
    @Schema(example = "hocvien01@example.com")
    private String email;

    @NotBlank(message = "01105")
    @Size(min = 6, max = 6, message = "01105")
    @Pattern(regexp = "^[0-9]{6}$", message = "01105")
    @Schema(example = "123456")
    private String otp;
}
