package vn.duy.signlight.billing.application;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Tích hợp cổng thanh toán payOS qua REST API và xác thực chữ ký HMAC SHA-256.
 */
@Component
public class PayOsClient {

    private static final Logger log = LoggerFactory.getLogger(PayOsClient.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final String clientId;
    private final String apiKey;
    private final String checksumKey;
    private final String endpoint;
    private final String returnUrl;
    private final String cancelUrl;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PayOsClient(
            @Value("${signlight.payos.client-id:}") String clientId,
            @Value("${signlight.payos.api-key:}") String apiKey,
            @Value("${signlight.payos.checksum-key:}") String checksumKey,
            @Value("${signlight.payos.endpoint:https://api-merchant.payos.vn}") String endpoint,
            @Value("${signlight.payos.return-url:http://localhost:3000/thanh-toan/thanh-cong}") String returnUrl,
            @Value("${signlight.payos.cancel-url:http://localhost:3000/nang-cap}") String cancelUrl,
            ObjectMapper objectMapper) {
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
        this.endpoint = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        this.returnUrl = returnUrl;
        this.cancelUrl = cancelUrl;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().build();
    }

    public PayOsPaymentResult createPaymentLink(long orderCode, int amount, String description) {
        String safeDescription = description.length() > 25 ? description.substring(0, 25) : description;

        if (isMockConfig()) {
            throw new IllegalStateException("payOS credentials are not configured");
        }

        try {
            // Chuỗi ký theo chuẩn payOS: amount={}&cancelUrl={}&description={}&orderCode={}&returnUrl={}
            String signatureData = "amount=" + amount
                    + "&cancelUrl=" + cancelUrl
                    + "&description=" + safeDescription
                    + "&orderCode=" + orderCode
                    + "&returnUrl=" + returnUrl;
            String signature = hmacSha256(signatureData, checksumKey);

            Map<String, Object> requestBody = Map.of(
                    "orderCode", orderCode,
                    "amount", amount,
                    "description", safeDescription,
                    "cancelUrl", cancelUrl,
                    "returnUrl", returnUrl,
                    "signature", signature
            );

            PayOsCreateResponse response = restClient.post()
                    .uri(endpoint + "/v2/payment-requests")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(PayOsCreateResponse.class);

            if (response != null && "00".equals(response.code()) && response.data() != null) {
                return new PayOsPaymentResult(
                        response.data().paymentLinkId(),
                        response.data().checkoutUrl(),
                        response.data().qrCode(),
                        response.data().status(),
                        response.data().accountNumber(),
                        response.data().accountName(),
                        response.data().bin(),
                        response.data().description() != null ? response.data().description() : safeDescription
                );
            }
            throw new IllegalStateException("payOS rejected payment link creation");
        } catch (Exception ex) {
            log.warn("payos_payment_link_creation_failed");
            throw new IllegalStateException("payOS payment service is unavailable", ex);
        }
    }

    public boolean verifyWebhookSignature(Map<String, Object> data, String signature) {
        if (signature == null || signature.isBlank()) {
            return false;
        }
        if (data == null || data.isEmpty()) {
            return false;
        }

        try {
            // Sắp xếp các key theo thứ tự a-z
            Map<String, Object> sorted = new TreeMap<>();
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (entry.getValue() != null && !entry.getKey().equals("signature")) {
                    sorted.put(entry.getKey(), entry.getValue());
                }
            }

            StringBuilder signData = new StringBuilder();
            for (Map.Entry<String, Object> entry : sorted.entrySet()) {
                if (!signData.isEmpty()) {
                    signData.append("&");
                }
                signData.append(entry.getKey()).append("=").append(entry.getValue());
            }

            String calculated = hmacSha256(signData.toString(), checksumKey);
            return calculated.equalsIgnoreCase(signature);
        } catch (Exception ex) {
            log.error("payos_verify_signature_exception", ex);
            return false;
        }
    }

    public boolean isMockConfig() {
        return clientId == null || clientId.isBlank() || clientId.startsWith("mock")
                || apiKey == null || apiKey.isBlank() || apiKey.startsWith("mock")
                || checksumKey == null || checksumKey.isBlank() || checksumKey.startsWith("mock");
    }

    private String hmacSha256(String data, String key) {
        if (key == null || key.isBlank()) {
            return "";
        }
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký HMAC SHA-256", ex);
        }
    }

    public java.util.Optional<PayOsPaymentResult> getPaymentLinkInformation(long orderCode) {
        if (isMockConfig()) {
            return java.util.Optional.empty();
        }

        try {
            PayOsCreateResponse response = restClient.get()
                    .uri(endpoint + "/v2/payment-requests/" + orderCode)
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .retrieve()
                    .body(PayOsCreateResponse.class);

            if (response != null && "00".equals(response.code()) && response.data() != null) {
                return java.util.Optional.of(new PayOsPaymentResult(
                        response.data().effectivePaymentLinkId(),
                        response.data().checkoutUrl(),
                        response.data().qrCode(),
                        response.data().status(),
                        response.data().accountNumber(),
                        response.data().accountName(),
                        response.data().bin(),
                        response.data().description()
                ));
            }
        } catch (Exception ex) {
            log.warn("payos_get_payment_info_failed orderCode={} msg={}", orderCode, ex.getMessage());
        }
        return java.util.Optional.empty();
    }

    public record PayOsPaymentResult(
            String paymentLinkId,
            String checkoutUrl,
            String qrCode,
            String status,
            String accountNumber,
            String accountName,
            String bin,
            String description) {

        public PayOsPaymentResult(String paymentLinkId, String checkoutUrl, String qrCode, String status) {
            this(paymentLinkId, checkoutUrl, qrCode, status, null, null, null, null);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PayOsCreateResponse(
            String code,
            String desc,
            PayOsData data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PayOsData(
            String id,
            String paymentLinkId,
            String checkoutUrl,
            String qrCode,
            String status,
            String accountNumber,
            String accountName,
            String bin,
            String description) {
        public String effectivePaymentLinkId() {
            return paymentLinkId != null && !paymentLinkId.isBlank() ? paymentLinkId : id;
        }
    }
}
