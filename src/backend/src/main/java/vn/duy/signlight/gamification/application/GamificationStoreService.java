package vn.duy.signlight.gamification.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.duy.signlight.common.error.BusinessException;
import vn.duy.signlight.common.error.ErrorCode;
import vn.duy.signlight.gamification.domain.Streak;
import vn.duy.signlight.gamification.domain.UserInventory;
import vn.duy.signlight.gamification.repository.StreakRepository;
import vn.duy.signlight.gamification.repository.UserInventoryRepository;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemRequest;
import vn.duy.signlight.gamification.web.dto.RedeemStoreItemResult;
import vn.duy.signlight.gamification.web.dto.StoreCatalogResult;
import vn.duy.signlight.identity.domain.UserProfile;
import vn.duy.signlight.identity.repository.UserProfileRepository;
import vn.duy.signlight.notification.application.NotificationService;

@Service
public class GamificationStoreService {

    private static final Logger log = LoggerFactory.getLogger(GamificationStoreService.class);

    public static final String ITEM_AI_BONUS_3 = "AI_BONUS_3";
    public static final String ITEM_AI_BONUS_10 = "AI_BONUS_10";
    public static final String ITEM_STREAK_FREEZE = "STREAK_FREEZE";
    public static final String ITEM_BADGE_AMBASSADOR = "BADGE_AMBASSADOR";
    public static final String ITEM_BADGE_PERSISTENCE = "BADGE_PERSISTENCE";
    public static final String ITEM_BADGE_COMMUNITY_HERO = "BADGE_COMMUNITY_HERO";

    /** Nguồn giá EXP duy nhất; API danh mục và API đổi thưởng cùng đọc danh sách này. */
    private static final List<StoreItemDefinition> STORE_CATALOG = List.of(
            new StoreItemDefinition(ITEM_AI_BONUS_3, "AI_QUOTA", "+3 lượt luyện AI Camera",
                    "Thêm 3 lượt chấm Camera AI sau khi dùng hết hạn mức miễn phí trong ngày.",
                    50, "Đổi thành công +3 lượt luyện Camera AI."),
            new StoreItemDefinition(ITEM_AI_BONUS_10, "AI_QUOTA", "+10 lượt luyện AI Camera",
                    "Gói tiết kiệm thêm 10 lượt chấm Camera AI.",
                    130, "Đổi thành công +10 lượt luyện Camera AI."),
            new StoreItemDefinition(ITEM_STREAK_FREEZE, "STREAK", "Băng bảo vệ chuỗi Streak",
                    "Bảo vệ chuỗi học nếu bạn lỡ nghỉ một ngày; mỗi tài khoản giữ tối đa 3 băng.",
                    100, "Đổi thành công 1 băng bảo vệ chuỗi Streak."),
            new StoreItemDefinition(ITEM_BADGE_AMBASSADOR, "BADGE", "Huy hiệu Đại sứ VSL",
                    "Huy hiệu danh dự cho học viên lan tỏa Ngôn ngữ Ký hiệu Việt Nam.",
                    150, "Mở khóa thành công Huy hiệu Đại sứ VSL!"),
            new StoreItemDefinition(ITEM_BADGE_PERSISTENCE, "BADGE", "Huy hiệu Đôi tay kiên trì",
                    "Huy hiệu ghi nhận sự chuyên cần trên hành trình học.",
                    200, "Mở khóa thành công Huy hiệu Đôi tay kiên trì!"),
            new StoreItemDefinition(ITEM_BADGE_COMMUNITY_HERO, "BADGE", "Huy hiệu Người thắp sáng cộng đồng",
                    "Huy hiệu đặc biệt dành cho học viên tích cực kết nối cộng đồng.",
                    300, "Mở khóa thành công Huy hiệu Người thắp sáng cộng đồng!")
    );

    private record StoreItemDefinition(
            String key, String type, String title, String description, int costExp, String successMessage) {
    }

    private final UserProfileRepository userProfileRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final StreakRepository streakRepository;
    private final NotificationService notificationService;

    public GamificationStoreService(
            UserProfileRepository userProfileRepository,
            UserInventoryRepository userInventoryRepository,
            StreakRepository streakRepository) {
        this(userProfileRepository, userInventoryRepository, streakRepository, null);
    }

    @Autowired
    public GamificationStoreService(
            UserProfileRepository userProfileRepository,
            UserInventoryRepository userInventoryRepository,
            StreakRepository streakRepository,
            @Autowired(required = false) NotificationService notificationService) {
        this.userProfileRepository = userProfileRepository;
        this.userInventoryRepository = userInventoryRepository;
        this.streakRepository = streakRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public StoreCatalogResult catalog(UUID userId) {
        UserProfile profile = userId != null ? userProfileRepository.findById(userId).orElse(null) : null;
        int expBalance = profile != null ? profile.getExpBalance() : 0;
        int aiBonusQuota = profile != null ? profile.getAiBonusQuota() : 0;

        List<Streak> streaks = userId != null ? streakRepository.findByUserId(userId) : List.of();
        int freezeCount = streaks.isEmpty() ? 0 : streaks.get(0).getFreezeCount();

        List<UserInventory> ownedItems = userId != null ? userInventoryRepository.findByUserId(userId) : List.of();
        List<String> ownedBadges = ownedItems.stream()
                .filter(i -> "BADGE".equals(i.getItemType()))
                .map(UserInventory::getItemKey)
                .toList();

        List<StoreCatalogResult.StoreItemDto> items = STORE_CATALOG.stream()
                .map(item -> new StoreCatalogResult.StoreItemDto(
                        item.key(), item.type(), item.title(), item.description(), item.costExp(),
                        "BADGE".equals(item.type())
                                ? ownedBadges.contains(item.key())
                                : ITEM_STREAK_FREEZE.equals(item.key()) && freezeCount >= 3))
                .toList();

        return new StoreCatalogResult(expBalance, aiBonusQuota, freezeCount, 0, items, ownedBadges);
    }

    @Transactional
    public RedeemStoreItemResult redeem(UUID userId, RedeemStoreItemRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        String itemKey = request.getItemKey();
        StoreItemDefinition definition = STORE_CATALOG.stream()
                .filter(item -> item.key().equals(itemKey))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PAYLOAD));
        int cost = definition.costExp();
        String itemType = definition.type();
        String successMessage = definition.successMessage();

        if ("BADGE".equals(itemType) && userInventoryRepository.existsByUserIdAndItemTypeAndItemKey(userId, itemType, itemKey)) {
            throw new BusinessException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        if (profile.getExpBalance() < cost) {
            throw new BusinessException(ErrorCode.EXP_INSUFFICIENT);
        }

        List<Streak> streaks = ITEM_STREAK_FREEZE.equals(itemKey)
                ? streakRepository.findByUserId(userId)
                : List.of();
        if (ITEM_STREAK_FREEZE.equals(itemKey)
                && (streaks.isEmpty() || streaks.get(0).getFreezeCount() >= 3)) {
            throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        profile.setExpBalance(profile.getExpBalance() - cost);

        int newAiQuota = profile.getAiBonusQuota();
        int newFreezeCount = 0;

        if (ITEM_AI_BONUS_3.equals(itemKey)) {
            newAiQuota += 3;
            profile.setAiBonusQuota(newAiQuota);
        } else if (ITEM_AI_BONUS_10.equals(itemKey)) {
            newAiQuota += 10;
            profile.setAiBonusQuota(newAiQuota);
        } else if (ITEM_STREAK_FREEZE.equals(itemKey)) {
            Streak streak = streaks.get(0);
            streak.setFreezeCount((short) (streak.getFreezeCount() + 1));
            streakRepository.save(streak);
            newFreezeCount = streak.getFreezeCount();
        }

        userProfileRepository.save(profile);

        UserInventory inventoryItem = UserInventory.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .itemType(itemType)
                .itemKey(itemKey)
                .metadata("Cost: " + cost + " EXP")
                .createdAt(Instant.now())
                .build();
        userInventoryRepository.save(inventoryItem);

        log.info("store_item_redeemed userId={} itemKey={} cost={} newExp={}",
                userId, itemKey, cost, profile.getExpBalance());

        if (notificationService != null) {
            try {
                notificationService.sendNotification(userId, "Cửa hàng EXP: Đổi thưởng thành công", successMessage, "STORE", "/cua-hang");
            } catch (Exception e) {
                log.warn("failed_to_send_store_notification", e);
            }
        }

        return new RedeemStoreItemResult(
                itemKey,
                itemType,
                cost,
                profile.getExpBalance(),
                profile.getAiBonusQuota(),
                newFreezeCount,
                0,
                successMessage
        );
    }

    @Transactional(readOnly = true)
    public int getAiBonusQuota(UUID userId) {
        return userProfileRepository.findById(userId)
                .map(UserProfile::getAiBonusQuota)
                .orElse(0);
    }

    @Transactional
    public void awardExp(UUID userId, int amount) {
        if (amount <= 0) {
            return;
        }
        userProfileRepository.findById(userId).ifPresent(profile -> {
            profile.setExpBalance(profile.getExpBalance() + amount);
            userProfileRepository.save(profile);
            log.info("exp_awarded userId={} amount={} newBalance={}", userId, amount, profile.getExpBalance());
        });
    }

    @Transactional
    public boolean consumeAiBonusQuota(UUID userId) {
        return userProfileRepository.findById(userId).map(profile -> {
            if (profile.getAiBonusQuota() > 0) {
                profile.setAiBonusQuota(profile.getAiBonusQuota() - 1);
                userProfileRepository.save(profile);
                log.info("ai_bonus_quota_consumed userId={} remaining={}", userId, profile.getAiBonusQuota());
                return true;
            }
            return false;
        }).orElse(false);
    }
}
