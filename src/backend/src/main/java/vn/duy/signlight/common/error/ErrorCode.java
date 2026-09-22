package vn.duy.signlight.common.error;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Danh mục mã lỗi — nguồn sự thật là {@code docs/sa/LLD.md} §5.1.
 *
 * <p>Định dạng 5 ký tự {@code [MM][T][NN]}. Mã đã bỏ (ví dụ {@code 06104}) <b>không</b> được tái dùng.
 * Mỗi mã ở đây phải có khoá tương ứng trong {@code messages*.properties}.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ---------------------------------------------------------------- chung (00)
    SUCCESS("00000"),
    INVALID_PAYLOAD("00101"),
    RATE_LIMITED("00105"),
    UNAUTHENTICATED("00401"),
    FORBIDDEN("00403"),
    NOT_FOUND("00404"),
    SYSTEM_ERROR("00499"),

    // ------------------------------------------------------------- identity (01)
    REGISTRATION_INVALID("01101"),
    PASSWORD_TOO_COMMON("01102"),
    TERMS_NOT_ACCEPTED("01103"),
    EMAIL_ALREADY_VERIFIED("01104"),
    OTP_INVALID("01105"),
    OTP_EXPIRED("01106"),
    RESET_TOKEN_INVALID("01107"),
    RESET_TOKEN_EXPIRED("01108"),
    OTP_RATE_LIMITED("01109"),
    LOGIN_FAILED("01201"),
    ACCOUNT_LOCKED("01202"),
    ACCOUNT_SUSPENDED("01203"),
    TOKEN_REUSE_DETECTED("01204"),

    // -------------------------------------------------------------- content (02)
    CONTENT_NOT_PUBLISHED("02201"),

    // ------------------------------------------------------------- learning (03)
    EXERCISE_NOT_IN_LESSON("03101"),
    ANSWER_TYPE_MISMATCH("03102"),
    LESSON_LOCKED("03201"),

    // ------------------------------------------------------------- dictionary (04)
    DICTIONARY_QUOTA_EXCEEDED("04201"),

    // --------------------------------------------------------------- billing (06)
    PAYMENT_NOT_COMPLETED("06101"),
    PREMIUM_REQUIRED("06203"),
    AI_QUOTA_EXCEEDED("06204"),

    // --------------------------------------------------------- airecognition (10)
    AI_MODEL_VERSION_UNSUPPORTED("10101"),
    AI_FEATURES_INVALID("10102"),
    AI_MEDIA_NOT_ALLOWED("10103"),
    AI_FRAME_COUNT_OUT_OF_RANGE("10104"),
    AI_SIGN_NOT_RECOGNIZABLE("10201"),
    AI_DONATION_NOT_CONSENTED("10202"),
    AI_SERVICE_UNAVAILABLE("10301"),
    AI_SERVICE_TIMEOUT("10302"),
    AI_INTERNAL_ERROR("10401");

    private final String code;
}
