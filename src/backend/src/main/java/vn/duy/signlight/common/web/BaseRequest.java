package vn.duy.signlight.common.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Phần chung của mọi request (api-spec §1 — envelope).
 *
 * <p>{@code requestId} do client sinh, server echo lại nguyên văn và dùng luôn làm {@code traceId}
 * (NFR-17).
 */
@Data
public class BaseRequest {

    @NotBlank(message = "00101")
    @Pattern(regexp = "^[a-zA-Z0-9_-]{6,64}$", message = "00101")
    @Schema(description = "Mã truy vết do client sinh", example = "a1b2c3d4")
    private String requestId;

    @NotBlank(message = "00101")
    @Schema(description = "Phiên bản hợp đồng API", example = "1.0")
    private String version = "1.0";
}
