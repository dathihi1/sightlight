package vn.duy.signlight.airecognition.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.airecognition.domain.AiModelVersion;
import vn.duy.signlight.airecognition.domain.AiSignLabel;
import vn.duy.signlight.airecognition.repository.AiDailyQuotaRepository;
import vn.duy.signlight.airecognition.repository.AiSignLabelRepository;
import vn.duy.signlight.airecognition.repository.SignAttemptRepository;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.content.application.ContentTreeService;
import vn.duy.signlight.content.application.MediaUrlService;
import vn.duy.signlight.gamification.application.GamificationStoreService;
import vn.duy.signlight.gamification.application.QuestService;
import vn.duy.signlight.identity.application.AuthService;

class AiRecognitionServiceModelSelectionTest {

    private static final String MODEL_30 = "vsl-mvp30-v2-lite-transformer";
    private static final String MODEL_400 = "vsl-mvp400-v2-lite-transformer";

    private AiModelSyncService modelSyncService;
    private AiSignLabelRepository labelRepository;
    private AuthService authService;
    private AiRecognitionService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        modelSyncService = mock(AiModelSyncService.class);
        labelRepository = mock(AiSignLabelRepository.class);
        authService = mock(AuthService.class);
        service = new AiRecognitionService(
                mock(AiInferenceClient.class),
                modelSyncService,
                labelRepository,
                mock(SignAttemptRepository.class),
                mock(AiDailyQuotaRepository.class),
                mock(ContentTreeService.class),
                mock(MediaUrlService.class),
                authService,
                new ObjectMapper(),
                mock(GamificationStoreService.class),
                mock(QuestService.class),
                MODEL_30,
                MODEL_400);
        userId = UUID.randomUUID();

        AiModelVersion model30 = model(MODEL_30, 30);
        AiModelVersion model400 = model(MODEL_400, 400);
        when(modelSyncService.versionByCode(MODEL_30)).thenReturn(Optional.of(model30));
        when(modelSyncService.versionByCode(MODEL_400)).thenReturn(Optional.of(model400));
        when(modelSyncService.enabledLabels(model30.getId())).thenReturn(List.of());
        when(modelSyncService.enabledLabels(model400.getId())).thenReturn(List.of());
    }

    @Test
    void premiumUserCanChooseEitherModel() {
        when(authService.isPremium(userId)).thenReturn(true);

        var compact = service.capabilities(userId, 30);
        var broad = service.capabilities(userId, 400);

        assertEquals(MODEL_30, compact.modelVersion());
        assertEquals(MODEL_400, broad.modelVersion());
        assertEquals(List.of(30, 400), compact.availableModelSizes());
    }

    @Test
    void freeUserCanChooseModel30ButNotModel400() {
        when(authService.isPremium(userId)).thenReturn(false);

        var compact = service.capabilities(userId, 30);
        BusinessException error = assertThrows(BusinessException.class,
                () -> service.capabilities(userId, 400));

        assertEquals(MODEL_30, compact.modelVersion());
        assertEquals(List.of(30), compact.availableModelSizes());
        assertEquals("10101", error.getErrorCode());
    }

    @Test
    void matchingTop1IsVerifiedEvenBelowThresholdAndMargin() {
        AiModelVersion version = model(MODEL_30, 30);
        UUID signId = UUID.randomUUID();
        AiSignLabel target = AiSignLabel.builder()
                .id(UUID.randomUUID())
                .modelVersionId(version.getId())
                .labelIndex((short) 0)
                .rawLabel("Anh")
                .stableSignId("anh")
                .signId(signId)
                .enabled(true)
                .build();
        when(labelRepository.findByModelVersionId(version.getId())).thenReturn(List.of(target));

        var inference = new AiInferenceClient.InferenceResponse(
                "ok",
                "Anh",
                "anh",
                0.21,
                List.of(
                        new AiInferenceClient.Prediction("Anh", "anh", 0.21),
                        new AiInferenceClient.Prediction("Bạn", "ban", 0.20)),
                null,
                10.0,
                false,
                false);

        var verdict = service.decide(version, target, inference);

        assertEquals(true, verdict.verified());
        assertEquals("ok", verdict.status());
        assertEquals(signId, verdict.predictedSignId());
        assertEquals(BigDecimal.valueOf(0.210).setScale(3), verdict.confidence());
    }

    private AiModelVersion model(String versionCode, int classes) {
        return AiModelVersion.builder()
                .id(UUID.randomUUID())
                .versionCode(versionCode)
                .numClasses((short) classes)
                .sequenceLength((short) 64)
                .featureDim((short) 327)
                .schemaVersion("holistic-327-v1")
                .confidenceThreshold(BigDecimal.valueOf(0.55))
                .confidenceMargin(BigDecimal.valueOf(0.03))
                .active(true)
                .syncedAt(Instant.now())
                .build();
    }
}
