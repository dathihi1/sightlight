package vn.duy.signlight.billing.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CheckoutRequest {

    @Schema(description = "Request ID phục vụ đối soát", example = "req-123456")
    private String requestId;

    @NotBlank
    @Schema(description = "Mã gói dịch vụ", example = "PREMIUM_1M")
    private String planId;
}
