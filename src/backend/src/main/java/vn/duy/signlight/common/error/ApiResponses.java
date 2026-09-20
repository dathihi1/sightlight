package vn.duy.signlight.common.error;

import vn.duy.signlight.common.i18n.Translator;
import vn.duy.signlight.common.web.TransactionResponse;

/** Nhà máy dựng envelope — controller không tự ghép {@code errorMessage}. */
public final class ApiResponses {

    private ApiResponses() {
    }

    public static <T> TransactionResponse<T> ok(String requestId, T result) {
        return TransactionResponse.<T>builder()
                .requestId(requestId)
                .errorCode(ErrorCode.SUCCESS.getCode())
                .errorMessage(Translator.toLocale(ErrorCode.SUCCESS.getCode()))
                .result(result)
                .build();
    }

    public static <T> TransactionResponse<T> error(String requestId, String errorCode) {
        return TransactionResponse.<T>builder()
                .requestId(requestId)
                .errorCode(errorCode)
                .errorMessage(Translator.toLocale(errorCode))
                .result(null)
                .build();
    }
}
