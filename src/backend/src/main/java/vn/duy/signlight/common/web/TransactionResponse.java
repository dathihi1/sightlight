package vn.duy.signlight.common.web;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Envelope chuẩn của mọi response, kể cả 4xx/5xx (error-code-convention §1). */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TransactionResponse<T> {

    @Schema(description = "Khớp requestId client đã gửi", example = "a1b2c3d4")
    private String requestId;

    @Schema(description = "5 ký tự [MM][T][NN]; 00000 = thành công", example = "00000")
    private String errorCode;

    @Schema(description = "Thông điệp theo ngôn ngữ của người dùng", example = "Success")
    private String errorMessage;

    @Schema(description = "Nội dung nghiệp vụ; null khi lỗi")
    private T result;
}
