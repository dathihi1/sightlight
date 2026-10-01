package vn.duy.signlight.advertising.application;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.duy.signlight.advertising.web.dto.AdRewardResult;
import vn.duy.signlight.gamification.application.QuestService;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdRewardServiceTest {

    @Mock
    private UserProfileRepository profileRepository;

    @Mock
    private QuestService questService;

    @Mock
    private NotificationService notificationService;

    private AdRewardService adRewardService;

    @BeforeEach
    void setUp() {
        adRewardService = new AdRewardService(profileRepository, questService, notificationService);
    }

    @Test
    @DisplayName("Xem video nhận +1 lượt camera AI")
    void claimReward_aiQuota_success() {
        UUID userId = UUID.randomUUID();
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(100)
                .aiBonusQuota(2)
                .build();

        when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));

        AdRewardResult result = adRewardService.claimReward(userId, "AI_QUOTA", "CAMERA_MODAL");

        assertEquals("AI_QUOTA", result.rewardType());
        assertEquals(1, result.amountGranted());
        assertEquals(3, result.newAiBonusQuota());
        verify(profileRepository).save(profile);
        verify(questService).recordAction(eq(userId), eq("WATCH_AD"), eq(1));
    }

    @Test
    @DisplayName("Xem video nhận +30 EXP")
    void claimReward_exp_success() {
        UUID userId = UUID.randomUUID();
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(100)
                .aiBonusQuota(2)
                .build();

        when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));

        AdRewardResult result = adRewardService.claimReward(userId, "EXP", "STORE_PAGE");

        assertEquals("EXP", result.rewardType());
        assertEquals(30, result.amountGranted());
        assertEquals(130, result.newExpBalance());
        verify(profileRepository).save(profile);
        verify(questService).recordAction(eq(userId), eq("WATCH_AD"), eq(1));
    }
}
