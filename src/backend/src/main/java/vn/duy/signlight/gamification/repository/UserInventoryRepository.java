package vn.duy.signlight.gamification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.duy.signlight.gamification.domain.UserInventory;

public interface UserInventoryRepository extends JpaRepository<UserInventory, UUID> {
    List<UserInventory> findByUserId(UUID userId);
    List<UserInventory> findByUserIdAndItemType(UUID userId, String itemType);
    Optional<UserInventory> findByUserIdAndItemTypeAndItemKey(UUID userId, String itemType, String itemKey);
    boolean existsByUserIdAndItemTypeAndItemKey(UUID userId, String itemType, String itemKey);
}
