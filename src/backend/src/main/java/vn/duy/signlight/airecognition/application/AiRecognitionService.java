package vn.duy.signlight.airecognition.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.airecognition.domain.AiDailyQuota;
import vn.duy.signlight.airecognition.domain.AiModelVersion;
import vn.duy.signlight.airecognition.domain.AiSignLabel;
import vn.duy.signlight.airecognition.domain.SignAttempt;
import vn.duy.signlight.airecognition.repository.AiDailyQuotaRepository;
import vn.duy.signlight.airecognition.repository.AiSignLabelRepository;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.airecognition.web.dto.AiAttemptRequest;
import vn.duy.signlight.airecognition.web.dto.AiAttemptResult;
import vn.duy.signlight.airecognition.web.dto.AiCapabilitiesResult;
import vn.duy.signlight.airecognition.web.dto.AiPracticeSessionResult;
import vn.duy.signlight.airecognition.web.dto.AiQuotaResult;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.content.domain.Sign;
import vn.duy.signlight.content.domain.SignVideo;
import vn.duy.signlight.identity.application.AuthService;

/**
 * Chấm một lượt ký hiệu động (FR-41 → FR-43) — trái tim của module M10.
 *
 * <p>Ba nguyên tắc chi phối toàn bộ lớp này:
 * <ol>
 *   <li><b>Backend quyết định {@code verified}</b>, không phải dịch vụ AI (ADR-09). Dịch vụ AI chỉ
 *       trả xác suất; ngưỡng và biên là luật nghiệp vụ, đọc từ {@code ai_model_version}.</li>
 *   <li><b>Lỗi hệ thống không phải lỗi người học</b>: {@code 10301}/{@code 10302} không trừ hạn mức,
 *       không ghi lượt thất bại (NFR-20, AC-41.6).</li>
 *   <li><b>Không pixel nào được lưu</b>: chỉ kết luận và chỉ số chất lượng dạng số (NFR-12).</li>
 * </ol>
 */
@Service
public class AiRecognitionService {

    private static final Logger log = LoggerFactory.getLogger(AiRecognitionService.class);

    /** Hạn mức ngày cho người dùng miễn phí (BR-A108). */
    private static final int FREE_DAILY_QUOTA = 5;

    private static final String STATUS_OK = "ok";
    private static final String STATUS_WRONG_TARGET = "wrong_target";
    private static final String STATUS_LOW_CONFIDENCE = "low_confidence";
    private static final String STATUS_UNCERTAIN_INTENT = "uncertain_intent";
    private static final String STATUS_NO_HAND = "no_hand";
    private static final String STATUS_NOT_ENOUGH_FRAMES = "not_enough_frames";

    /** Ngưỡng chất lượng tại chỗ — dưới mức này thì không gửi lên mô hình (BR-A118). */
    private static final double MIN_HAND_FRAME_RATIO = 0.55;

    private final AiInferenceClient aiClient;
    private final AiModelSyncService modelSyncService;
    private final AiSignLabelRepository labelRepository;
    private final SignAttemptRepository attemptRepository;
    private final AiDailyQuotaRepository quotaRepository;
    private final ContentTreeService contentTree;
    private final MediaUrlService mediaUrlService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final vn.duy.signlight.gamification.application.GamificationStoreService gamificationStoreService;
    private final vn.duy.signlight.gamification.application.QuestService questService;

    public AiRecognitionService(AiInferenceClient aiClient,
            AiModelSyncService modelSyncService,
            AiSignLabelRepository labelRepository,
            SignAttemptRepository attemptRepository,
            AiDailyQuotaRepository quotaRepository,
            ContentTreeService contentTree,
            MediaUrlService mediaUrlService,
            AuthService authService,
            ObjectMapper objectMapper,
            vn.duy.signlight.gamification.application.GamificationStoreService gamificationStoreService,
            vn.duy.signlight.gamification.application.QuestService questService) {
        this.aiClient = aiClient;
        this.modelSyncService = modelSyncService;
        this.labelRepository = labelRepository;
        this.attemptRepository = attemptRepository;
        this.quotaRepository = quotaRepository;
        this.contentTree = contentTree;
        this.mediaUrlService = mediaUrlService;
        this.authService = authService;
        this.objectMapper = objectMapper;
        this.gamificationStoreService = gamificationStoreService;
        this.questService = questService;
    }

    // ------------------------------------------------------------ capabilities

    @Transactional(readOnly = true)
    public AiCapabilitiesResult capabilities() {
        AiModelVersion version = modelSyncService.activeVersion();
        List<UUID> recognizable = modelSyncService.enabledLabels(version.getId()).stream()
                .map(AiSignLabel::getSignId)
                .filter(java.util.Objects::nonNull)
                .toList();

        return new AiCapabilitiesResult(
                version.getVersionCode(),
                version.getSequenceLength(),
                version.getFeatureDim(),
                version.getSchemaVersion(),
                FeatureSchema.MIN_FRAMES,
                FeatureSchema.MAX_FRAMES,
                recognizable,
                new AiCapabilitiesResult.LandmarkSpec(
                        FeatureSchema.POSE_LANDMARK_INDICES, FeatureSchema.SLICES),
                FeatureSchema.ATTRIBUTION_TEXT,
                FeatureSchema.DISCLAIMER_TEXT,
                version.getVersionCode().endsWith("-stub"));
    }

    @Transactional(readOnly = true)
    public AiPracticeSessionResult practiceSession(int size) {
        return practiceSession(null, size);
    }

    @Transactional(readOnly = true)
    public AiPracticeSessionResult practiceSession(UUID preferredSignId, int size) {
        AiModelVersion version = modelSyncService.activeVersion();
        List<AiSignLabel> enabledLabels = labelRepository.findByModelVersionIdAndEnabledTrue(version.getId());

        List<UUID> recognizableSignIds = enabledLabels.stream()
                .map(AiSignLabel::getSignId)
                .filter(java.util.Objects::nonNull)
                .toList();

        List<UUID> orderedSignIds = new ArrayList<>();
        if (preferredSignId != null && recognizableSignIds.contains(preferredSignId)) {
            orderedSignIds.add(preferredSignId);
        }

        // Ưu tiên các ký hiệu có video web cục bộ sẵn sàng (web/*.mp4) để người học luôn có video mẫu chuẩn
        Map<UUID, SignVideo> videos = contentTree.primaryVideos(recognizableSignIds);

        List<UUID> withLocalWebVideos = recognizableSignIds.stream()
                .filter(id -> !orderedSignIds.contains(id))
                .filter(id -> {
                    SignVideo v = videos.get(id);
                    return v != null && v.getObjectKey() != null && v.getObjectKey().startsWith("web/");
                })
                .toList();
        orderedSignIds.addAll(withLocalWebVideos);

        for (UUID id : recognizableSignIds) {
            if (!orderedSignIds.contains(id)) {
                orderedSignIds.add(id);
            }
            if (orderedSignIds.size() >= size) {
                break;
            }
        }

        List<UUID> selectedIds = orderedSignIds.stream().limit(size).toList();
        Map<UUID, Sign> signsById = contentTree.publishedSigns(selectedIds).stream()
                .collect(java.util.stream.Collectors.toMap(Sign::getId, java.util.function.Function.identity(), (a, b) -> a));

        List<AiPracticeSessionResult.PracticeItem> items = new ArrayList<>();
        for (UUID signId : selectedIds) {
            Sign sign = signsById.get(signId);
            if (sign == null) {
                continue;
            }
            SignVideo video = videos.get(signId);
            items.add(new AiPracticeSessionResult.PracticeItem(
                    sign.getId(),
                    sign.getWord(),
                    sign.getTopic(),
                    video == null ? null : mediaUrlService.resolveVideoUrl(video),
                    video != null && video.getObjectKey() != null && video.getObjectKey().startsWith("seed/")));
        }

        return new AiPracticeSessionResult(UUID.randomUUID(), version.getVersionCode(), items);
    }

    // ------------------------------------------------------------------ chấm

    @Transactional
    public AiAttemptResult score(UUID userId, AiAttemptRequest request) {
        if (request.containsMedia()) {
            // Không log tên trường kèm nội dung — chỉ đủ để điều tra (NFR-12, DR-12).
            log.warn("ai_attempt_rejected reason=media_in_payload userId={}", userId);
            throw new BusinessException(ErrorCode.AI_MEDIA_NOT_ALLOWED);
        }

        AiModelVersion version = modelSyncService.activeVersion();
        if (!version.getVersionCode().equals(request.getModelVersion())) {
            throw new BusinessException(ErrorCode.AI_MODEL_VERSION_UNSUPPORTED);
        }

        AiSignLabel targetLabel = labelRepository
                .findByModelVersionIdAndSignIdAndEnabledTrue(version.getId(), request.getTargetSignId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AI_SIGN_NOT_RECOGNIZABLE));

        validateTensor(request, version);

        // Cổng chất lượng tại chỗ (BR-A118): thiếu tay thì không gửi lên mô hình và KHÔNG trừ hạn mức.
        if (request.getFrameCount() < FeatureSchema.MIN_FRAMES) {
            return recordNonCountingAttempt(userId, request, version, STATUS_NOT_ENOUGH_FRAMES);
        }
        if (request.getClientQuality().getHandFrameRatio() < MIN_HAND_FRAME_RATIO) {
            return recordNonCountingAttempt(userId, request, version, STATUS_NO_HAND);
        }

        boolean premium = authService.isPremium(userId);
        String timezone = authService.timezoneOf(userId);
        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        boolean usedBonus = false;
        if (!premium && usedToday(userId, today) >= FREE_DAILY_QUOTA) {
            if (!gamificationStoreService.consumeAiBonusQuota(userId)) {
                throw new BusinessException(ErrorCode.AI_QUOTA_EXCEEDED);
            }
            usedBonus = true;
        }

        // Từ đây trở xuống mới thật sự gọi mô hình. Lỗi tích hợp ném ra ngoài nguyên vẹn để
        // GlobalExceptionHandler trả 503/504 — và vì chưa ghi gì, hạn mức không bị trừ.
        AiInferenceClient.InferenceResponse inference =
                aiClient.infer(request.getFeatures(), request.getModelVersion());

        Verdict verdict = decide(version, targetLabel, inference);
        int used = (premium || usedBonus) ? 0 : incrementQuota(userId, today);
        if (verdict.verified()) {
            gamificationStoreService.awardExp(userId, 5);
        }
        questService.recordAction(userId, "PRACTICE_AI", 1);

        SignAttempt attempt = SignAttempt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .targetSignId(request.getTargetSignId())
                .modelVersionId(version.getId())
                .status(verdict.status())
                .verified(verdict.verified())
                .predictedSignId(verdict.predictedSignId())
                .confidence(verdict.confidence())
                .top3(writeJson(verdict.top3()))
                .quality(writeJson(inference.quality()))
                .durationMs(request.getDurationMs())
                .countedAgainstQuota(true)
                .inferenceLatencyMs(inference.inferenceLatencyMs() == null
                        ? null : (int) Math.round(inference.inferenceLatencyMs()))
                .sessionId(request.getSessionId())
                .createdAt(Instant.now())
                .build();
        attemptRepository.save(attempt);

        return new AiAttemptResult(
                attempt.getId(),
                verdict.verified(),
                verdict.status(),
                verdict.confidence() == null ? null : verdict.confidence().doubleValue(),
                verdict.predictedSignId(),
                verdict.predictedLabel(),
                showTop3(verdict.status()) ? verdict.top3() : null,
                qualityHints(verdict.status(), request.getClientQuality()),
                true,
                premium ? null : Math.max(0, FREE_DAILY_QUOTA - used),
                consecutiveFailures(userId, request.getTargetSignId()),
                Boolean.TRUE.equals(inference.stubMode()));
    }

    /**
     * Áp luật nghiệp vụ lên xác suất của mô hình.
     *
     * <ul>
     *   <li>BR-A112 — đúng khi {@code confidence >= ngưỡng} <b>và</b> nhãn khớp mục tiêu;</li>
     *   <li>BR-A113 — {@code top1 − top2 < biên} thì coi là {@code uncertain_intent}, dù top1 cao.</li>
     * </ul>
     */
    private Verdict decide(AiModelVersion version, AiSignLabel target,
            AiInferenceClient.InferenceResponse inference) {
        List<AiInferenceClient.Prediction> predictions =
                inference.top3() == null ? List.of() : inference.top3();
        if (predictions.isEmpty()) {
            return new Verdict(STATUS_LOW_CONFIDENCE, false, null, null, null, List.of());
        }

        AiInferenceClient.Prediction top1 = predictions.get(0);
        double confidence = top1.confidence() == null ? 0.0 : top1.confidence();
        double margin = predictions.size() > 1 && predictions.get(1).confidence() != null
                ? confidence - predictions.get(1).confidence()
                : 1.0;

        Map<String, AiSignLabel> labelsByStableId = labelRepository
                .findByModelVersionId(version.getId()).stream()
                .collect(java.util.stream.Collectors.toMap(AiSignLabel::getStableSignId,
                        label -> label, (first, second) -> first));

        List<AiAttemptResult.Prediction> top3 = predictions.stream()
                .map(prediction -> {
                    AiSignLabel label = labelsByStableId.get(prediction.stableSignId());
                    return new AiAttemptResult.Prediction(
                            label == null ? null : label.getSignId(),
                            prediction.label(),
                            prediction.confidence() == null ? 0.0 : prediction.confidence());
                })
                .toList();

        AiSignLabel predictedLabel = labelsByStableId.get(top1.stableSignId());
        UUID predictedSignId = predictedLabel == null ? null : predictedLabel.getSignId();
        BigDecimal roundedConfidence = BigDecimal.valueOf(confidence)
                .setScale(3, RoundingMode.HALF_UP);

        boolean matchesTarget = target.getStableSignId().equals(top1.stableSignId());
        double threshold = version.getConfidenceThreshold().doubleValue();
        double minMargin = version.getConfidenceMargin().doubleValue();

        String status;
        if (margin < minMargin) {
            status = STATUS_UNCERTAIN_INTENT;
        } else if (confidence < threshold) {
            status = STATUS_LOW_CONFIDENCE;
        } else if (!matchesTarget) {
            status = STATUS_WRONG_TARGET;
        } else {
            status = STATUS_OK;
        }

        return new Verdict(status, STATUS_OK.equals(status), predictedSignId, top1.label(),
                roundedConfidence, top3);
    }

    /** Sinh gợi ý sửa theo bảng ở FR-43. Tối đa 2 câu (BR-A121), giọng khuyến khích (BR-A123). */
    private List<String> qualityHints(String status, AiAttemptRequest.ClientQuality quality) {
        List<String> hints = new ArrayList<>(2);
        if (quality.getHandFrameRatio() < MIN_HAND_FRAME_RATIO
                || STATUS_NO_HAND.equals(status)) {
            hints.add("Đưa bàn tay vào giữa khung hình và đứng cách camera khoảng một sải tay.");
        }
        if (quality.getBothHandsRatio() < 0.35) {
            hints.add("Giữ cả hai bàn tay trong khung nếu ký hiệu sử dụng hai tay.");
        }
        if (hints.size() < 2) {
            switch (status) {
                case STATUS_NOT_ENOUGH_FRAMES ->
                        hints.add("Thực hiện trọn động tác trong khoảng hai giây.");
                case STATUS_LOW_CONFIDENCE, STATUS_UNCERTAIN_INTENT ->
                        hints.add("Thử lại chậm hơn và bắt đầu đúng tư thế như trong video mẫu.");
                case STATUS_WRONG_TARGET ->
                        hints.add("Ký hiệu nhận được chưa khớp từ đang luyện. Hãy xem lại video mẫu.");
                default -> {
                    // `ok` không cần gợi ý; các trạng thái còn lại dùng câu chung.
                    if (!STATUS_OK.equals(status)) {
                        hints.add("Đảm bảo đủ sáng, nền đơn giản và camera nhìn rõ phần thân trên.");
                    }
                }
            }
        }
        return hints.size() > 2 ? hints.subList(0, 2) : hints;
    }

    private boolean showTop3(String status) {
        return STATUS_WRONG_TARGET.equals(status) || STATUS_UNCERTAIN_INTENT.equals(status);
    }

    /**
     * Lượt bị chặn ở cổng chất lượng: vẫn ghi lại để phân tích, nhưng
     * {@code countedAgainstQuota = false} (FR-42).
     */
    private AiAttemptResult recordNonCountingAttempt(UUID userId, AiAttemptRequest request,
            AiModelVersion version, String status) {
        SignAttempt attempt = SignAttempt.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .targetSignId(request.getTargetSignId())
                .modelVersionId(version.getId())
                .status(status)
                .verified(false)
                .quality(writeJson(request.getClientQuality()))
                .durationMs(request.getDurationMs())
                .countedAgainstQuota(false)
                .sessionId(request.getSessionId())
                .createdAt(Instant.now())
                .build();
        attemptRepository.save(attempt);

        boolean premium = authService.isPremium(userId);
        LocalDate today = LocalDate.now(ZoneId.of(authService.timezoneOf(userId)));
        return new AiAttemptResult(attempt.getId(), false, status, null, null, null, null,
                qualityHints(status, request.getClientQuality()), false,
                premium ? null : Math.max(0, FREE_DAILY_QUOTA - usedToday(userId, today)),
                consecutiveFailures(userId, request.getTargetSignId()),
                version.getVersionCode().endsWith("-stub"));
    }

    private void validateTensor(AiAttemptRequest request, AiModelVersion version) {
        List<List<Float>> features = request.getFeatures();
        if (features.size() != version.getSequenceLength()) {
            throw new BusinessException(ErrorCode.AI_FEATURES_INVALID);
        }
        for (List<Float> frame : features) {
            if (frame == null || frame.size() != version.getFeatureDim()) {
                throw new BusinessException(ErrorCode.AI_FEATURES_INVALID);
            }
            for (Float value : frame) {
                if (value == null || !Float.isFinite(value)
                        || Math.abs(value) > FeatureSchema.MAX_ABS_VALUE) {
                    throw new BusinessException(ErrorCode.AI_FEATURES_INVALID);
                }
            }
        }
        if (request.getFrameCount() > FeatureSchema.MAX_FRAMES) {
            throw new BusinessException(ErrorCode.AI_FRAME_COUNT_OUT_OF_RANGE);
        }
    }

    // ------------------------------------------------------------- hạn mức

    @Transactional(readOnly = true)
    public AiQuotaResult quota(UUID userId) {
        if (authService.isPremium(userId)) {
            return new AiQuotaResult(0, null, null, null, true);
        }
        String timezone = authService.timezoneOf(userId);
        LocalDate today = LocalDate.now(ZoneId.of(timezone));
        int used = usedToday(userId, today);
        int bonus = gamificationStoreService.getAiBonusQuota(userId);
        int remaining = Math.max(0, FREE_DAILY_QUOTA - used) + bonus;
        return new AiQuotaResult(used, FREE_DAILY_QUOTA + bonus,
                remaining,
                today.plusDays(1).atStartOfDay().toString(),
                false);
    }

    private int usedToday(UUID userId, LocalDate today) {
        return quotaRepository.findByUserIdAndQuotaDateLocal(userId, today)
                .map(AiDailyQuota::getUsedCount)
                .orElse((short) 0);
    }

    private int incrementQuota(UUID userId, LocalDate today) {
        AiDailyQuota quota = quotaRepository.findByUserIdAndQuotaDateLocal(userId, today)
                .orElseGet(() -> AiDailyQuota.builder()
                        .userId(userId)
                        .quotaDateLocal(today)
                        .usedCount((short) 0)
                        .build());
        quota.setUsedCount((short) (quota.getUsedCount() + 1));
        quotaRepository.save(quota);
        return quota.getUsedCount();
    }

    /** Ba lần liên tiếp chưa đạt thì giao diện chủ động đề nghị lối thoát (BR-A122). */
    private int consecutiveFailures(UUID userId, UUID targetSignId) {
        List<SignAttempt> recent = attemptRepository
                .findByUserIdAndTargetSignIdOrderByCreatedAtDesc(userId, targetSignId,
                        PageRequest.of(0, 10));
        int failures = 0;
        for (SignAttempt attempt : recent) {
            if (attempt.isVerified()) {
                break;
            }
            failures++;
        }
        return failures;
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
            log.warn("json_serialize_failed type={}", value.getClass().getSimpleName());
            return null;
        }
    }

    /** Kết luận nội bộ trước khi dựng DTO. */
    private record Verdict(
            String status,
            boolean verified,
            UUID predictedSignId,
            String predictedLabel,
            BigDecimal confidence,
            List<AiAttemptResult.Prediction> top3) {
    }

    /** Ký hiệu có được chấm AI không — dùng cho từ điển (BR-A111). */
    @Transactional(readOnly = true)
    public boolean isRecognizable(UUID signId) {
        try {
            AiModelVersion version = modelSyncService.activeVersion();
            return labelRepository
                    .findByModelVersionIdAndSignIdAndEnabledTrue(version.getId(), signId)
                    .isPresent();
        } catch (BusinessException ex) {
            return false;   // chưa đồng bộ được mô hình -> coi như chưa hỗ trợ chấm tự động
        }
    }

    /** Tập ký hiệu có chấm AI — tra một lần cho cả trang kết quả tìm kiếm. */
    @Transactional(readOnly = true)
    public java.util.Set<UUID> recognizableSignIds() {
        try {
            AiModelVersion version = modelSyncService.activeVersion();
            return modelSyncService.enabledLabels(version.getId()).stream()
                    .map(AiSignLabel::getSignId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
        } catch (BusinessException ex) {
            return java.util.Set.of();
        }
    }
}
