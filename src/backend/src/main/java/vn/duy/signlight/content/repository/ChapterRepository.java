package vn.duy.signlight.content.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.Chapter;

public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    List<Chapter> findByUnitIdInOrderByOrderIndexAsc(Collection<UUID> unitIds);
}
