package vn.duy.signlight.content.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.content.domain.Unit;

public interface UnitRepository extends JpaRepository<Unit, UUID> {

    List<Unit> findByCourseIdOrderByOrderIndexAsc(UUID courseId);
}
