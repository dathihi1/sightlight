package vn.duy.signlight.identity.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GoogleLoginRequest {

    @Schema(description = "Request ID phục vụ đối soát", example = "req-123456")
    private String requestId;

    @NotBlank
    @Schema(description = "Google ID Token trả về từ Google Identity Services", example = "eyJhbGciOiJSUzI1NiIsIm...")
    private String idToken;
}
