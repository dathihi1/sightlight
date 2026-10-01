package vn.duy.signlight.referral.application;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import vn.duy.signlight.billing.application.BillingService;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.identity.domain.AppUser;
import vn.duy.signlight.identity.repository.AppUserRepository;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;
import vn.duy.signlight.referral.web.dto.ReferralSummaryResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReferralServiceTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private UserProfileRepository profileRepository;

    @Mock
    private BillingService billingService;

    @Mock
    private NotificationService notificationService;

    private ReferralService referralService;

    @BeforeEach
    void setUp() {
        referralService = new ReferralService(userRepository, profileRepository, billingService, notificationService);
        ReflectionTestUtils.setField(referralService, "frontendBaseUrl", "https://signlight.id.vn");
    }

    @Test
    @DisplayName("Lấy tổng quan referral: tự sinh mã nếu chưa có")
    void getSummary_generatesCodeIfNull() {
        UUID userId = UUID.randomUUID();
        AppUser user = AppUser.builder()
                .id(userId)
                .email("test@signlight.vn")
                .referralCode(null)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findByReferredByUserId(userId)).thenReturn(List.of());

        ReferralSummaryResult summary = referralService.getSummary(userId);
        assertNotNull(summary.referralCode());
        assertTrue(summary.referralCode().startsWith("SL"));
        assertEquals(0, summary.invitedCount());
        assertEquals(5, summary.targetCount());
    }

    @Test
    @DisplayName("Nhập mã referral thành công và tự kích hoạt Premium khi đủ 5 bạn")
    void claimCode_successAndGrantsPremiumAt5() {
        UUID userId = UUID.randomUUID();
        UUID referrerId = UUID.randomUUID();

        AppUser user = AppUser.builder()
                .id(userId)
                .email("user@signlight.vn")
                .referralCode("SLUSER01")
                .referredByUserId(null)
                .build();

        AppUser referrer = AppUser.builder()
                .id(referrerId)
                .email("referrer@signlight.vn")
                .referralCode("SLREF001")
                .referralRewardClaimed(false)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findByReferralCode("SLREF001")).thenReturn(Optional.of(referrer));
        when(userRepository.countByReferredByUserId(referrerId)).thenReturn(5L);

        referralService.claimCode(userId, "SLREF001");

        assertEquals(referrerId, user.getReferredByUserId());
        verify(billingService).grantFreePremium(eq(referrerId), eq(30), any());
        assertTrue(referrer.isReferralRewardClaimed());
    }

    @Test
    @DisplayName("Không được tự nhập mã giới thiệu của chính mình")
    void claimCode_cannotReferSelf() {
        UUID userId = UUID.randomUUID();
        AppUser user = AppUser.builder()
                .id(userId)
                .email("self@signlight.vn")
                .referralCode("SLSELF01")
                .referredByUserId(null)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findByReferralCode("SLSELF01")).thenReturn(Optional.of(user));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> referralService.claimCode(userId, "SLSELF01"));
        assertEquals(ErrorCode.INVALID_PAYLOAD.getCode(), ex.getErrorCode());
    }
}
