package vn.duy.signlight.billing.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RedeemCodeRequest {

    @Schema(description = "Request ID phục vụ đối soát", example = "req-123456")
    private String requestId;

    @NotBlank
    @Schema(description = "Mã quà tặng hoặc mã giới thiệu", example = "TRIAN2026")
    private String code;
}
