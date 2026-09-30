package vn.duy.signlight.gamification.application;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.domain.Quest;
import vn.duy.signlight.gamification.domain.UserQuestProgress;
import vn.duy.signlight.gamification.repository.QuestRepository;
import vn.duy.signlight.gamification.repository.UserQuestProgressRepository;
import vn.duy.signlight.gamification.web.dto.QuestProgressDto;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;

@Service
public class QuestService {

    private static final Logger log = LoggerFactory.getLogger(QuestService.class);

    private final QuestRepository questRepository;
    private final UserQuestProgressRepository progressRepository;
    private final GamificationStoreService storeService;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;

    public QuestService(
            QuestRepository questRepository,
            UserQuestProgressRepository progressRepository,
            GamificationStoreService storeService,
            UserProfileRepository userProfileRepository,
            NotificationService notificationService) {
        this.questRepository = questRepository;
        this.progressRepository = progressRepository;
        this.storeService = storeService;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<QuestProgressDto> getDailyQuests(UUID userId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        List<Quest> activeQuests = questRepository.findByActiveAndQuestTypeOrderByOrderIndexAsc(true, "DAILY");
        List<UserQuestProgress> progressList = progressRepository.findByUserIdAndResetDate(userId, today);
        Map<UUID, UserQuestProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(UserQuestProgress::getQuestId, p -> p));

        List<QuestProgressDto> results = new ArrayList<>();
        for (Quest q : activeQuests) {
            UserQuestProgress p = progressMap.get(q.getId());
            int currentCount = p != null ? p.getCurrentCount() : 0;
            boolean completed = p != null && p.isCompleted();
            boolean claimed = p != null && p.isClaimed();

            results.add(new QuestProgressDto(
                    q.getId(),
                    q.getTitle(),
                    q.getDescription(),
                    q.getQuestType(),
                    q.getTargetAction(),
                    q.getTargetCount(),
                    Math.min(currentCount, q.getTargetCount()),
                    q.getRewardExp(),
                    q.getRewardAiBonus(),
                    completed,
                    claimed
            ));
        }
        return results;
    }

    @Transactional
    public void recordAction(UUID userId, String targetAction, int count) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        List<Quest> matchedQuests = questRepository.findByActiveOrderByOrderIndexAsc(true).stream()
                .filter(q -> targetAction.equalsIgnoreCase(q.getTargetAction()))
                .toList();

        for (Quest q : matchedQuests) {
            UserQuestProgress progress = progressRepository
                    .findByUserIdAndQuestIdAndResetDate(userId, q.getId(), today)
                    .orElseGet(() -> UserQuestProgress.builder()
                            .id(UUID.randomUUID())
                            .userId(userId)
                            .questId(q.getId())
                            .currentCount(0)
                            .completed(false)
                            .claimed(false)
                            .resetDate(today)
                            .updatedAt(Instant.now())
                            .build());

            if (!progress.isCompleted()) {
                progress.setCurrentCount(progress.getCurrentCount() + count);
                if (progress.getCurrentCount() >= q.getTargetCount()) {
                    progress.setCompleted(true);
                    log.info("quest_completed user_id={} quest_id={}", userId, q.getId());
                    // Bắn in-app notification cho user
                    notificationService.sendNotification(
                            userId,
                            "Nhiệm vụ hoàn thành: " + q.getTitle(),
                            "Bạn đã hoàn thành nhiệm vụ và có thể nhận thưởng " + q.getRewardExp() + " EXP!",
                            "QUEST",
                            "/hanh-trinh"
                    );
                }
                progress.setUpdatedAt(Instant.now());
                progressRepository.save(progress);
            }
        }
    }

    @Transactional
    public QuestProgressDto claimReward(UUID userId, UUID questId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        Quest quest = questRepository.findById(questId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        UserQuestProgress progress = progressRepository
                .findByUserIdAndQuestIdAndResetDate(userId, questId, today)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (!progress.isCompleted()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }
        if (progress.isClaimed()) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        // Cập nhật đã nhận thưởng
        progress.setClaimed(true);
        progress.setUpdatedAt(Instant.now());
        progressRepository.save(progress);

        // Thưởng EXP
        if (quest.getRewardExp() > 0) {
            storeService.awardExp(userId, quest.getRewardExp());
        }

        // Thưởng lượt AI bonus nếu có
        if (quest.getRewardAiBonus() > 0) {
            UserProfile profile = userProfileRepository.findById(userId).orElse(null);
            if (profile != null) {
                profile.setAiBonusQuota(profile.getAiBonusQuota() + quest.getRewardAiBonus());
                userProfileRepository.save(profile);
            }
        }

        return new QuestProgressDto(
                quest.getId(),
                quest.getTitle(),
                quest.getDescription(),
                quest.getQuestType(),
                quest.getTargetAction(),
                quest.getTargetCount(),
                progress.getCurrentCount(),
                quest.getRewardExp(),
                quest.getRewardAiBonus(),
                true,
                true
        );
    }
}
