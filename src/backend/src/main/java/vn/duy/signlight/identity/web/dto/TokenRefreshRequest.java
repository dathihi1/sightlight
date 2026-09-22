package vn.duy.signlight.identity.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import vn.duy.signlight.common.web.BaseRequest;

/** api-spec §3.20. */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TokenRefreshRequest extends BaseRequest {

    /** Fallback khi client khong dung cookie HttpOnly (vi du mobile, Postman). */
    private String refreshToken;
}
