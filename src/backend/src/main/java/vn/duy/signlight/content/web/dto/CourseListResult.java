package vn.duy.signlight.content.web.dto;

import java.util.List;
import java.util.UUID;

/** api-spec §2 endpoint 24 — danh sách khoá đang mở (FR-05, FR-10). */
public record CourseListResult(List<CourseItem> items) {

    public record CourseItem(
            UUID id,
            String code,
            String name,
            String status,
            boolean comingSoon) {
    }
}
