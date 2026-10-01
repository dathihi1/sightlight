package vn.duy.signlight.referral.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.duy.signlight.common.web.BaseRequest;

@Data
@EqualsAndHashCode(callSuper = true)
public class ClaimReferralCodeRequest extends BaseRequest {

    @NotBlank(message = "01101")
    @Size(min = 4, max = 20, message = "01101")
    private String referralCode;
}
