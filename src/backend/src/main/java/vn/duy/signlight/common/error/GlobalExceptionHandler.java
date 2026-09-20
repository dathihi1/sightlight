package vn.duy.signlight.common.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import vn.duy.signlight.common.web.RequestIdFilter;
import vn.duy.signlight.common.web.TransactionResponse;

/** Mọi lỗi rời khỏi controller đều đi qua đây và ra ngoài dưới dạng {@link TransactionResponse}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<TransactionResponse<Void>> handleBusiness(
            BusinessException ex, HttpServletRequest request) {
        String code = ex.getErrorCode();
        HttpStatus status = HttpStatusMapper.of(code);
        log.warn("business_error code={} status={} path={}", code, status.value(),
                request.getRequestURI());
        return ResponseEntity.status(status).body(ApiResponses.error(requestId(request), code));
    }

    /** Lỗi {@code @Valid}: annotation đặt {@code message} là chính mã lỗi validate (loại 1). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<TransactionResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String code = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .filter(Objects::nonNull)
                .filter(message -> message.length() == 5 && message.chars().allMatch(Character::isDigit))
                .findFirst()
                .orElse(ErrorCode.INVALID_PAYLOAD.getCode());
        log.warn("validation_error code={} path={}", code, request.getRequestURI());
        return ResponseEntity.status(HttpStatusMapper.of(code))
                .body(ApiResponses.error(requestId(request), code));
    }

    @ExceptionHandler({
            HandlerMethodValidationException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<TransactionResponse<Void>> handleMalformed(
            Exception ex, HttpServletRequest request) {
        log.warn("malformed_request path={} reason={}", request.getRequestURI(), ex.getClass().getSimpleName());
        String code = ErrorCode.INVALID_PAYLOAD.getCode();
        return ResponseEntity.status(HttpStatusMapper.of(code))
                .body(ApiResponses.error(requestId(request), code));
    }

    /** Fallback: 500, tuyệt đối không lộ stacktrace/SQL ra ngoài (DR-03). */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<TransactionResponse<Void>> handleUnexpected(
            Exception ex, HttpServletRequest request) {
        log.error("unexpected_error path={}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponses.error(requestId(request), ErrorCode.SYSTEM_ERROR.getCode()));
    }

    private String requestId(HttpServletRequest request) {
        String fromMdc = MDC.get(RequestIdFilter.MDC_KEY);
        return fromMdc != null ? fromMdc : request.getHeader(RequestIdFilter.HEADER);
    }
}
