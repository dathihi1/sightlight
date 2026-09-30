package vn.duy.signlight.admin.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.admin.web.dto.AdminQuestDtos;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.domain.Quest;
import vn.duy.signlight.gamification.repository.QuestRepository;

@Service
public class AdminQuestService {

    private static final Logger log = LoggerFactory.getLogger(AdminQuestService.class);

    private final QuestRepository questRepository;

    public AdminQuestService(QuestRepository questRepository) {
        this.questRepository = questRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminQuestDtos.QuestItem> listAllQuests() {
        return questRepository.findAllByOrderByOrderIndexAsc().stream()
                .map(AdminQuestDtos.QuestItem::from)
                .toList();
    }

    @Transactional
    public UUID createQuest(AdminQuestDtos.QuestUpsertRequest req) {
        UUID id = UUID.randomUUID();
        Quest quest = Quest.builder()
                .id(id)
                .title(req.title())
                .description(req.description())
                .questType(req.questType() != null ? req.questType() : "DAILY")
                .targetAction(req.targetAction())
                .targetCount(Math.max(1, req.targetCount()))
                .rewardExp(req.rewardExp())
                .rewardAiBonus(req.rewardAiBonus())
                .active(req.active())
                .orderIndex(req.orderIndex())
                .createdAt(Instant.now())
                .build();
        questRepository.save(quest);
        log.info("admin_created_quest id={} title={}", id, req.title());
        return id;
    }

    @Transactional
    public void updateQuest(UUID id, AdminQuestDtos.QuestUpsertRequest req) {
        Quest quest = questRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        quest.setTitle(req.title());
        quest.setDescription(req.description());
        if (req.questType() != null) quest.setQuestType(req.questType());
        if (req.targetAction() != null) quest.setTargetAction(req.targetAction());
        quest.setTargetCount(Math.max(1, req.targetCount()));
        quest.setRewardExp(req.rewardExp());
        quest.setRewardAiBonus(req.rewardAiBonus());
        quest.setActive(req.active());
        quest.setOrderIndex(req.orderIndex());

        questRepository.save(quest);
        log.info("admin_updated_quest id={}", id);
    }

    @Transactional
    public boolean toggleActive(UUID id) {
        Quest quest = questRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        quest.setActive(!quest.isActive());
        questRepository.save(quest);
        log.info("admin_toggled_quest id={} active={}", id, quest.isActive());
        return quest.isActive();
    }

    @Transactional
    public void deleteQuest(UUID id) {
        questRepository.deleteById(id);
        log.info("admin_deleted_quest id={}", id);
    }
}
