package vn.duy.signlight.common.error;

import lombok.Getter;

/** Lỗi nghiệp vụ mang theo mã 5 ký tự. Không bao giờ để lọt xuống fallback {@code 00499}. */
@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getCode());
        this.errorCode = errorCode.getCode();
    }

    public BusinessException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getCode(), cause);
        this.errorCode = errorCode.getCode();
    }
}
