package vn.duy.signlight.gamification.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.duy.signlight.gamification.domain.Quest;

public interface QuestRepository extends JpaRepository<Quest, UUID> {
    List<Quest> findByActiveOrderByOrderIndexAsc(boolean active);
    List<Quest> findByActiveAndQuestTypeOrderByOrderIndexAsc(boolean active, String questType);
    List<Quest> findAllByOrderByOrderIndexAsc();

    @Query("""
            select q from Quest q
            where (cast(:search as string) is null or lower(cast(q.title as string)) like lower(concat('%', cast(:search as string), '%'))
                   or lower(cast(q.description as string)) like lower(concat('%', cast(:search as string), '%')))
              and (:questType is null or q.questType = :questType)
              and (:active is null or q.active = :active)
            """)
    Page<Quest> adminSearch(
            @Param("search") String search,
            @Param("questType") String questType,
            @Param("active") Boolean active,
            Pageable pageable);
}
