package vn.duy.signlight.learning.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3.7 — hoàn thành bài học, idempotent theo `idempotencyKey` (BR-A31). */
@Data
@EqualsAndHashCode(callSuper = true)
public class CompleteLessonRequest extends BaseRequest {

    @NotNull(message = "00101")
    @Schema(example = "5c2f1a90-3b7e-4f21-9a11-8d0c2e4b7f33")
    private UUID idempotencyKey;

    @NotNull(message = "00101")
    @Min(value = 0, message = "00101")
    @Max(value = 3600, message = "00101")
    @Schema(example = "265", description = "Giây có tương tác; server áp trần 15 phút (BR-A46)")
    private Integer activeSeconds;
}
