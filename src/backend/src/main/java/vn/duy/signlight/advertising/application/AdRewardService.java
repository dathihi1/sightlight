package vn.duy.signlight.advertising.application;

import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.advertising.web.dto.AdRewardResult;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.application.QuestService;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;

@Service
public class AdRewardService {

    private static final Logger log = LoggerFactory.getLogger(AdRewardService.class);

    private final UserProfileRepository profileRepository;
    private final QuestService questService;
    private final NotificationService notificationService;

    @Autowired
    public AdRewardService(
            UserProfileRepository profileRepository,
            @Autowired(required = false) QuestService questService,
            @Autowired(required = false) NotificationService notificationService) {
        this.profileRepository = profileRepository;
        this.questService = questService;
        this.notificationService = notificationService;
    }

    @Transactional
    public AdRewardResult claimReward(UUID userId, String rewardType, String placement) {
        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        int granted;
        String msg;
        if ("AI_QUOTA".equalsIgnoreCase(rewardType)) {
            granted = 1; // +1 lượt camera AI
            profile.setAiBonusQuota(profile.getAiBonusQuota() + granted);
            msg = "Chúc mừng bạn nhận được +1 lượt thực hành Camera AI miễn phí!";
        } else {
            granted = 30; // +30 EXP
            profile.setExpBalance(profile.getExpBalance() + granted);
            msg = "Chúc mừng bạn nhận được +30 EXP!";
        }
        profileRepository.save(profile);

        if (questService != null) {
            try {
                questService.recordAction(userId, "WATCH_AD", 1);
            } catch (Exception e) {
                log.warn("failed_to_record_watch_ad_quest", e);
            }
        }

        if (notificationService != null) {
            try {
                notificationService.sendNotification(userId, "Phần thưởng xem video", msg, "REWARD", "/cua-hang");
            } catch (Exception e) {
                log.warn("failed_to_send_ad_reward_notification", e);
            }
        }

        log.info("ad_reward_claimed userId={} rewardType={} amount={} placement={}",
                userId, rewardType, granted, placement);

        return new AdRewardResult(rewardType, granted, profile.getExpBalance(), profile.getAiBonusQuota(), msg);
    }
}
