package vn.duy.signlight.gamification.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.gamification.domain.Quest;

public interface QuestRepository extends JpaRepository<Quest, UUID> {
    List<Quest> findByActiveOrderByOrderIndexAsc(boolean active);
    List<Quest> findByActiveAndQuestTypeOrderByOrderIndexAsc(boolean active, String questType);
    List<Quest> findAllByOrderByOrderIndexAsc();
}
