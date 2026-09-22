package vn.duy.signlight.billing.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.duy.signlight.billing.application.BillingService;
import vn.duy.signlight.billing.web.dto.PayOsWebhookPayload;

@RestController
@RequestMapping("/api/v1/billing/ipn")
@Tag(name = "billing")
@SecurityRequirements
public class PayOsWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PayOsWebhookController.class);

    private final BillingService billingService;
    private final ObjectMapper objectMapper;

    public PayOsWebhookController(BillingService billingService, ObjectMapper objectMapper) {
        this.billingService = billingService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/payos")
    @Operation(summary = "Webhook IPN nhận thông báo thanh toán thành công từ payOS")
    public ResponseEntity<Map<String, Object>> payosWebhook(@RequestBody String rawPayload) {
        try {
            PayOsWebhookPayload payload = objectMapper.readValue(rawPayload, PayOsWebhookPayload.class);
            boolean processed = billingService.handlePayOsWebhook(payload, rawPayload);
            return ResponseEntity.ok(Map.of("code", "00", "desc", "success", "success", processed));
        } catch (Exception ex) {
            log.error("payos_webhook_parsing_failed", ex);
            return ResponseEntity.ok(Map.of("code", "00", "desc", "received", "success", false));
        }
    }
}
