package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3.1 — đăng ký tài khoản người học (FR-01). */
@Data
@EqualsAndHashCode(callSuper = true)
public class RegisterRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Size(min = 2, max = 50, message = "01101")
    @Schema(example = "Nguyen Van A")
    private String displayName;

    @NotBlank(message = "01101")
    @Email(message = "01101")
    @Size(max = 254, message = "01101")
    @Schema(example = "hocvien01@example.com")
    private String email;

    /** 10–128 ký tự, bắt buộc có cả chữ và số (FR-01 bảng validate). */
    @NotBlank(message = "01101")
    @Size(min = 10, max = 128, message = "01101")
    @Pattern(regexp = ".*[a-zA-Z].*", message = "01101")
    @Pattern(regexp = ".*[0-9].*", message = "01101")
    @Schema(example = "hocKyHieu2026")
    private String password;

    @AssertTrue(message = "01103")
    @Schema(example = "true")
    private boolean acceptedTerms;

    @Schema(description = "Gắn câu trả lời onboarding của khách", nullable = true)
    private String onboardingToken;

    @Schema(example = "Asia/Ho_Chi_Minh")
    private String timezone;

    /** R-07: thu năm sinh ở onboarding để chặn góp dữ liệu khi dưới 16 tuổi (BR-A137). */
    @Schema(example = "2004", nullable = true)
    private Short birthYear;
}
