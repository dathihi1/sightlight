package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3.2 — đăng nhập (FR-02). */
@Data
@EqualsAndHashCode(callSuper = true)
public class LoginRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Size(max = 254, message = "01101")
    @Schema(example = "hocvien01@example.com")
    private String email;

    @NotBlank(message = "01101")
    @Size(max = 128, message = "01101")
    @Schema(example = "hocKyHieu2026")
    private String password;
}
