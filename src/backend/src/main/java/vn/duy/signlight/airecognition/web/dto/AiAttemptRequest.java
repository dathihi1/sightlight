package vn.duy.signlight.airecognition.web.dto;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/**
 * api-spec §3.12c — chấm một lượt ký hiệu động.
 *
 * <p><b>NFR-12:</b> payload chỉ được chứa <i>số</i>. Mọi trường mang ảnh/video/base64 đều bị từ chối
 * với mã {@code 10103}, kể cả khi client gửi nhầm. Các trường lạ được gom vào {@link #extras} rồi
 * kiểm ở {@link #containsMedia()} — từ chối tường minh vẫn tốt hơn lặng lẽ bỏ qua.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AiAttemptRequest extends BaseRequest {

    /** Tên trường bị cấm tuyệt đối — đồng bộ với `FORBIDDEN_MEDIA_KEYS` ở dịch vụ AI. */
    private static final Set<String> FORBIDDEN_MEDIA_KEYS = Set.of(
            "frame", "frames", "image", "images", "video", "clip", "photo",
            "jpeg", "jpg", "png", "base64", "imagedata", "framedata");

    @NotNull(message = "00101")
    @Schema(description = "Ký hiệu đang luyện; phải nằm trong recognizableSignIds")
    private UUID targetSignId;

    @NotBlank(message = "10101")
    @Schema(example = "vsl-mvp30-v2-lite-transformer")
    private String modelVersion;

    @NotEmpty(message = "10102")
    @Schema(description = "Tensor đặc trưng 64 × 327 đã chuẩn hoá ở trình duyệt")
    private List<List<Float>> features;

    @NotNull(message = "10104")
    @Min(value = 1, message = "10104")
    @Max(value = 64, message = "10104")
    @Schema(example = "21", description = "Số khung hữu ích thu được (8–32)")
    private Integer frameCount;

    @NotNull(message = "00101")
    @Min(value = 1, message = "00101")
    @Max(value = 6000, message = "00101")
    @Schema(example = "1840")
    private Integer durationMs;

    @NotNull(message = "00101")
    private ClientQuality clientQuality;

    @Schema(description = "Nhóm các lượt trong một phiên luyện", nullable = true)
    private UUID sessionId;

    @JsonIgnore
    private final Map<String, Object> extras = new LinkedHashMap<>();

    @JsonAnySetter
    public void putExtra(String key, Object value) {
        extras.put(key, value);
    }

    @JsonAnyGetter
    public Map<String, Object> extras() {
        return extras;
    }

    /** Có trường ảnh/video lọt vào payload không (kiểm cả tên viết hoa/thường). */
    public boolean containsMedia() {
        return extras.keySet().stream()
                .map(key -> key.toLowerCase(java.util.Locale.ROOT))
                .anyMatch(FORBIDDEN_MEDIA_KEYS::contains);
    }

    /** Chỉ số chất lượng do client đo — dùng để sinh gợi ý, không dùng để chấm đúng/sai. */
    @Data
    public static class ClientQuality {

        @NotNull(message = "00101")
        @Schema(example = "0.95")
        private Double handFrameRatio;

        @NotNull(message = "00101")
        @Schema(example = "0.88")
        private Double bothHandsRatio;

        @NotNull(message = "00101")
        @Schema(example = "true")
        private Boolean poseDetected;
    }
}
