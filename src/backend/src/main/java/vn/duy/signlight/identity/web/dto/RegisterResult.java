package vn.duy.signlight.identity.web.dto;

import java.util.UUID;

/**
 * api-spec §3.1. Không có mã lỗi "email đã tồn tại": trùng email trả về **đúng như thành công**
 * (NFR-08, AC-01.2) — xem `AuthService#register`.
 */
public record RegisterResult(
        UUID userId,
        String accessToken,
        String status,
        UUID activeCourseId) {
}
