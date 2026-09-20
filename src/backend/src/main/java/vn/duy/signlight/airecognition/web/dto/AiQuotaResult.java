package vn.duy.signlight.airecognition.web.dto;

/** api-spec §2 endpoint 56e — hạn mức lượt luyện AI còn lại hôm nay (FR-30, BR-A108). */
public record AiQuotaResult(
        int used,
        Integer limit,
        Integer remaining,
        String resetAtLocal,
        boolean unlimited) {
}
