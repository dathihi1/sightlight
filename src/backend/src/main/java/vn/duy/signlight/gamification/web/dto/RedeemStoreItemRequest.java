package vn.duy.signlight.gamification.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

@Data
@EqualsAndHashCode(callSuper = true)
public class RedeemStoreItemRequest extends BaseRequest {

    @NotBlank(message = "00101")
    private String itemKey;
}
