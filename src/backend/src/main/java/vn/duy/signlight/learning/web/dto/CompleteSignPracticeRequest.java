package vn.duy.signlight.learning.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import vn.duy.signlight.common.web.BaseRequest;

@Getter
@Setter
public class CompleteSignPracticeRequest extends BaseRequest {

    @NotNull(message = "00101")
    private UUID attemptId;
}
