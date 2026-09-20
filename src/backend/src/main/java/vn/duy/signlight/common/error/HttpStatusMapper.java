package vn.duy.signlight.common.error;

import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Suy HTTP status từ mã lỗi (error-code-convention §3).
 *
 * <p>Status phải phản ánh đúng kết cục để monitor/APM tách được lỗi — <b>không</b> gộp tất cả về 200.
 * Quy tắc mặc định theo ký tự loại (vị trí 3); phần còn lại nằm ở bảng ghi đè dưới đây, khớp cột HTTP
 * của {@code LLD.md} §5.1.
 */
public final class HttpStatusMapper {

    private static final Map<String, HttpStatus> OVERRIDES = Map.of(
            "00105", HttpStatus.TOO_MANY_REQUESTS,
            "00401", HttpStatus.UNAUTHORIZED,
            "00403", HttpStatus.FORBIDDEN,
            "00404", HttpStatus.NOT_FOUND,
            "02201", HttpStatus.NOT_FOUND,
            "10301", HttpStatus.SERVICE_UNAVAILABLE,
            "10302", HttpStatus.GATEWAY_TIMEOUT);

    private HttpStatusMapper() {
    }

    public static HttpStatus of(String errorCode) {
        if (ErrorCode.SUCCESS.getCode().equals(errorCode)) {
            return HttpStatus.OK;
        }
        HttpStatus override = OVERRIDES.get(errorCode);
        if (override != null) {
            return override;
        }
        char type = (errorCode != null && errorCode.length() == 5) ? errorCode.charAt(2) : '4';
        return switch (type) {
            case '1', '2' -> HttpStatus.BAD_REQUEST;
            case '3' -> HttpStatus.BAD_GATEWAY;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }
}
