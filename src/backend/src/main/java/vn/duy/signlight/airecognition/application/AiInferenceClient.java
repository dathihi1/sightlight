package vn.duy.signlight.airecognition.application;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;

/**
 * Client gọi dịch vụ AI nội bộ (api-spec §4).
 *
 * <p>Dịch vụ AI nằm trong mạng Docker, không có xác thực người dùng và <b>không</b> được mở ra
 * Internet (ADR-10, DR-12). Timeout 5 giây theo hợp đồng; quá hạn trả {@code 10302}, không phản hồi
 * trả {@code 10301} — cả hai đều <b>không</b> trừ hạn mức của người học (NFR-20).
 */
@Component
public class AiInferenceClient {

    private static final Logger log = LoggerFactory.getLogger(AiInferenceClient.class);

    private final RestClient restClient;
    private final String serviceToken;

    public AiInferenceClient(
            @Value("${signlight.ai.base-url}") String baseUrl,
            @Value("${signlight.ai.timeout-ms}") long timeoutMs,
            @Value("${signlight.ai.service-token:}") String serviceToken) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(Math.min(timeoutMs, 2000)));
        factory.setReadTimeout(Duration.ofMillis(timeoutMs));
        this.serviceToken = serviceToken;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .requestInterceptor((request, body, execution) -> {
                    if (StringUtils.hasText(this.serviceToken)) {
                        request.getHeaders().setBearerAuth(this.serviceToken);
                    }
                    return execution.execute(request, body);
                })
                .build();
    }

    /** Đọc vốn nhãn của mô hình đang nạp. Trả rỗng khi dịch vụ chưa sẵn sàng. */
    public Optional<LabelCatalog> labels() {
        return labels(null);
    }

    /** Đọc vốn nhãn của một model cụ thể trong AI service đa model. */
    public Optional<LabelCatalog> labels(String modelVersion) {
        try {
            return Optional.ofNullable(restClient.get()
                    .uri(builder -> {
                        builder.path("/api/labels");
                        if (StringUtils.hasText(modelVersion)) {
                            builder.queryParam("modelVersion", modelVersion);
                        }
                        return builder.build();
                    })
                    .retrieve()
                    .body(LabelCatalog.class));
        } catch (ResourceAccessException | org.springframework.web.client.RestClientResponseException ex) {
            log.warn("ai_labels_unavailable reason={}", ex.getClass().getSimpleName());
            return Optional.empty();
        }
    }

    /** Phân lớp tensor 64×327. Ném {@link BusinessException} với mã tích hợp khi dịch vụ lỗi. */
    public InferenceResponse infer(List<List<Float>> features, String modelVersion) {
        try {
            InferenceResponse response = restClient.post()
                    .uri("/api/infer/features")
                    .body(new InferenceRequest(features, modelVersion))
                    .retrieve()
                    .body(InferenceResponse.class);
            if (response == null) {
                throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
            }
            return response;
        } catch (ResourceAccessException ex) {
            // Đọc quá hạn 5 giây — phân biệt với "không kết nối được" để giám sát tách được hai ca.
            boolean timedOut = ex.getCause() instanceof java.net.SocketTimeoutException;
            log.warn("ai_infer_failed timedOut={} reason={}", timedOut, ex.getClass().getSimpleName());
            throw new BusinessException(timedOut
                    ? ErrorCode.AI_SERVICE_TIMEOUT
                    : ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (org.springframework.web.client.RestClientResponseException ex) {
            log.warn("ai_infer_rejected status={}", ex.getStatusCode().value());
            if (ex.getStatusCode().value() == 409) {
                throw new BusinessException(ErrorCode.AI_MODEL_VERSION_UNSUPPORTED);
            }
            if (ex.getStatusCode().value() == 400) {
                throw new BusinessException(ErrorCode.AI_FEATURES_INVALID);
            }
            throw new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    /** Thân request tới {@code POST /api/infer/features} — chỉ có tensor số, không có pixel. */
    public record InferenceRequest(List<List<Float>> features, String modelVersion) {
    }

    public record InferenceResponse(
            String status,
            String label,
            String stableSignId,
            Double confidence,
            List<Prediction> top3,
            Quality quality,
            Double inferenceLatencyMs,
            Boolean retainedMedia,
            Boolean stubMode) {
    }

    public record Prediction(String label, String stableSignId, Double confidence) {
    }

    public record Quality(Double handFrameRatio, Double bothHandsRatio, Boolean poseDetected) {
    }

    public record LabelCatalog(
            String modelVersion,
            String schemaVersion,
            Integer sequenceLength,
            Integer featureDim,
            Double confidenceThreshold,
            Double confidenceMargin,
            Boolean stubMode,
            List<LabelEntry> labels) {
    }

    public record LabelEntry(Integer index, String label, String stableSignId) {
    }
}
