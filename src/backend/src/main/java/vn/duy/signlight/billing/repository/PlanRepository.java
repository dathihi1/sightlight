package vn.duy.signlight.billing.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.billing.domain.Plan;

public interface PlanRepository extends JpaRepository<Plan, String> {

    List<Plan> findByActiveTrueOrderByPriceVndAsc();
}
