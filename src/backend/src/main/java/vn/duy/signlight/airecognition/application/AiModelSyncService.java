package vn.duy.signlight.airecognition.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.airecognition.domain.AiModelVersion;
import vn.duy.signlight.airecognition.domain.AiSignLabel;
import vn.duy.signlight.airecognition.repository.AiModelVersionRepository;
import vn.duy.signlight.airecognition.repository.AiSignLabelRepository;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.common.util.StableSignId;
import vn.duy.signlight.content.application.ContentCatalogService;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.repository.SignRepository;

/**
 * Đồng bộ vốn nhãn của mô hình vào CSDL và ánh xạ sang ký hiệu trong từ điển (FR-44).
 *
 * <p>Nhãn không ánh xạ được thành <b>nhãn mồ côi</b>: giữ lại để CMS nhìn thấy, nhưng
 * {@code enabled = false} nên không bao giờ hiện nút chấm AI cho người học (BR-A125).
 */
@Service
public class AiModelSyncService {

    private static final Logger log = LoggerFactory.getLogger(AiModelSyncService.class);

    private final AiInferenceClient aiClient;
    private final AiModelVersionRepository modelVersionRepository;
    private final AiSignLabelRepository labelRepository;
    private final SignRepository signRepository;

    public AiModelSyncService(AiInferenceClient aiClient,
            AiModelVersionRepository modelVersionRepository,
            AiSignLabelRepository labelRepository,
            SignRepository signRepository) {
        this.aiClient = aiClient;
        this.modelVersionRepository = modelVersionRepository;
        this.labelRepository = labelRepository;
        this.signRepository = signRepository;
    }

    /**
     * Kéo {@code GET /api/labels} về và ghi lại. Idempotent: gọi nhiều lần cho cùng kết quả.
     *
     * @return số nhãn đã ánh xạ được sang ký hiệu, hoặc rỗng nếu dịch vụ AI chưa sẵn sàng
     */
    @Transactional
    public Optional<SyncSummary> sync() {
        Optional<AiInferenceClient.LabelCatalog> catalog = aiClient.labels();
        if (catalog.isEmpty()) {
            log.warn("ai_sync_skipped reason=service_unavailable");
            return Optional.empty();
        }
        AiInferenceClient.LabelCatalog remote = catalog.get();

        AiModelVersion version = modelVersionRepository.findByVersionCode(remote.modelVersion())
                .orElseGet(() -> AiModelVersion.builder()
                        .id(UUID.randomUUID())
                        .versionCode(remote.modelVersion())
                        .build());
        version.setNumClasses((short) remote.labels().size());
        version.setSequenceLength(remote.sequenceLength().shortValue());
        version.setFeatureDim(remote.featureDim().shortValue());
        version.setSchemaVersion(remote.schemaVersion());
        version.setConfidenceThreshold(BigDecimal.valueOf(remote.confidenceThreshold()));
        version.setConfidenceMargin(BigDecimal.valueOf(remote.confidenceMargin()));
        version.setSyncedAt(Instant.now());

        // BR-A127: chỉ một bản active. Hạ bản cũ trước khi nâng bản mới, nếu không vi phạm
        // chỉ mục `uq_ai_model_active`.
        modelVersionRepository.findByActiveTrue().ifPresent(active -> {
            if (!active.getVersionCode().equals(remote.modelVersion())) {
                active.setActive(false);
                modelVersionRepository.saveAndFlush(active);
            }
        });
        version.setActive(true);
        modelVersionRepository.save(version);

        Map<String, Sign> signsByStableId = signRepository
                .findByStatusOrderByWordAsc(ContentCatalogService.STATUS_PUBLISHED).stream()
                .collect(java.util.stream.Collectors.toMap(
                        sign -> StableSignId.of(sign.getWord()),
                        Function.identity(),
                        (first, second) -> first));

        Map<Short, AiSignLabel> existing = labelRepository.findByModelVersionId(version.getId())
                .stream()
                .collect(java.util.stream.Collectors.toMap(AiSignLabel::getLabelIndex,
                        Function.identity(), (first, second) -> first));

        int mapped = 0;
        int orphaned = 0;
        for (AiInferenceClient.LabelEntry entry : remote.labels()) {
            String stableId = entry.stableSignId() != null
                    ? entry.stableSignId()
                    : StableSignId.of(entry.label());
            Sign sign = signsByStableId.get(stableId);

            AiSignLabel label = existing.getOrDefault(entry.index().shortValue(),
                    AiSignLabel.builder()
                            .id(UUID.randomUUID())
                            .modelVersionId(version.getId())
                            .labelIndex(entry.index().shortValue())
                            .build());
            label.setRawLabel(entry.label());
            label.setStableSignId(stableId);
            label.setSignId(sign == null ? null : sign.getId());
            label.setEnabled(sign != null);
            labelRepository.save(label);

            if (sign == null) {
                orphaned++;
            } else {
                mapped++;
            }
        }

        log.info("ai_sync_done modelVersion={} mapped={} orphaned={} stub={}",
                remote.modelVersion(), mapped, orphaned, remote.stubMode());
        return Optional.of(new SyncSummary(remote.modelVersion(), remote.labels().size(),
                mapped, orphaned, Boolean.TRUE.equals(remote.stubMode())));
    }

    @Transactional(readOnly = true)
    public AiModelVersion activeVersion() {
        return modelVersionRepository.findByActiveTrue()
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_SERVICE_UNAVAILABLE));
    }

    @Transactional(readOnly = true)
    public List<AiSignLabel> enabledLabels(UUID modelVersionId) {
        return labelRepository.findByModelVersionIdAndEnabledTrue(modelVersionId);
    }

    /** Kết quả một lần đồng bộ, dùng cho endpoint CMS và log vận hành. */
    public record SyncSummary(
            String modelVersion, int total, int mapped, int orphaned, boolean stubMode) {
    }
}
