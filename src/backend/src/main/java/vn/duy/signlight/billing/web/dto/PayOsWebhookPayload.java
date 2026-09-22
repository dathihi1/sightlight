package vn.duy.signlight.billing.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PayOsWebhookPayload(
        String code,
        String desc,
        Map<String, Object> data,
        String signature) {
}
