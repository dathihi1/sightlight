package vn.duy.signlight.gamification.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.domain.Streak;
import vn.duy.signlight.gamification.domain.UserInventory;
import vn.duy.signlight.gamification.repository.StreakRepository;
import vn.duy.signlight.gamification.repository.UserInventoryRepository;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemRequest;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemResult;
import vn.duy.signlight.gamification.web.dto.StoreCatalogResult;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;

class GamificationStoreServiceTest {

    private UserProfileRepository userProfileRepository;
    private UserInventoryRepository userInventoryRepository;
    private StreakRepository streakRepository;
    private GamificationStoreService storeService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userProfileRepository = mock(UserProfileRepository.class);
        userInventoryRepository = mock(UserInventoryRepository.class);
        streakRepository = mock(StreakRepository.class);
        storeService = new GamificationStoreService(
                userProfileRepository,
                userInventoryRepository,
                streakRepository
        );
        userId = UUID.randomUUID();
    }

    @Test
    void catalog_returnsItemsWithCorrectState() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(120)
                .aiBonusQuota(2)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(streakRepository.findByUserId(userId)).thenReturn(List.of(
                Streak.builder().userId(userId).freezeCount((short) 1).build()
        ));
        when(userInventoryRepository.findByUserId(userId)).thenReturn(List.of(
                UserInventory.builder().userId(userId).itemType("BADGE").itemKey("BADGE_AMBASSADOR").build()
        ));

        StoreCatalogResult result = storeService.catalog(userId);

        assertNotNull(result);
        assertEquals(120, result.expBalance());
        assertEquals(2, result.aiBonusQuota());
        assertEquals(1, result.freezeCount());
        assertTrue(result.ownedBadges().contains("BADGE_AMBASSADOR"));
    }

    @Test
    void redeem_aiBonusConsumableDeductsExpAndIncreasesQuota() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(100)
                .aiBonusQuota(0)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        RedeemStoreItemRequest req = new RedeemStoreItemRequest();
        req.setRequestId("req-test-123");
        req.setItemKey(GamificationStoreService.ITEM_AI_BONUS_3);

        RedeemStoreItemResult result = storeService.redeem(userId, req);

        assertNotNull(result);
        assertEquals(50, result.newExpBalance());
        assertEquals(3, result.newAiBonusQuota());
        verify(userProfileRepository).save(profile);
        verify(userInventoryRepository).save(any(UserInventory.class));
    }

    @Test
    void redeem_throwsWhenInsufficientExp() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(20)
                .aiBonusQuota(0)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        RedeemStoreItemRequest req = new RedeemStoreItemRequest();
        req.setRequestId("req-test-123");
        req.setItemKey(GamificationStoreService.ITEM_AI_BONUS_3);

        BusinessException ex = assertThrows(BusinessException.class, () -> storeService.redeem(userId, req));
        assertEquals(ErrorCode.EXP_INSUFFICIENT.getCode(), ex.getErrorCode());
    }

    @Test
    void redeem_badgeThrowsWhenAlreadyOwned() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(300)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(userInventoryRepository.existsByUserIdAndItemTypeAndItemKey(userId, "BADGE", "BADGE_AMBASSADOR"))
                .thenReturn(true);

        RedeemStoreItemRequest req = new RedeemStoreItemRequest();
        req.setRequestId("req-test-123");
        req.setItemKey("BADGE_AMBASSADOR");

        BusinessException ex = assertThrows(BusinessException.class, () -> storeService.redeem(userId, req));
        assertEquals(ErrorCode.ITEM_ALREADY_OWNED.getCode(), ex.getErrorCode());
    }

    @Test
    void awardExp_incrementsBalance() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .expBalance(50)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        storeService.awardExp(userId, 35);

        assertEquals(85, profile.getExpBalance());
        verify(userProfileRepository).save(profile);
    }

    @Test
    void consumeAiBonusQuota_decrementsWhenAvailable() {
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .aiBonusQuota(2)
                .displayName("Learner")
                .timezone("Asia/Ho_Chi_Minh")
                .build();
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        boolean consumed = storeService.consumeAiBonusQuota(userId);

        assertTrue(consumed);
        assertEquals(1, profile.getAiBonusQuota());

        profile.setAiBonusQuota(0);
        boolean consumedEmpty = storeService.consumeAiBonusQuota(userId);
        assertFalse(consumedEmpty);
    }
}
