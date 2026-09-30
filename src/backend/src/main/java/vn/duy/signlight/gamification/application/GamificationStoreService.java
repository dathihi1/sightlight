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
    public static final String ITEM_LESSON_UNLOCK_1 = "LESSON_UNLOCK_1";
    public static final String ITEM_LESSON_UNLOCK_UNIT = "LESSON_UNLOCK_UNIT";
    public static final String ITEM_STREAK_FREEZE = "STREAK_FREEZE";
    public static final String ITEM_EXP_BOOSTER = "EXP_BOOSTER";
    public static final String ITEM_BADGE_AMBASSADOR = "BADGE_AMBASSADOR";
    public static final String ITEM_BADGE_PERSISTENCE = "BADGE_PERSISTENCE";
    public static final String ITEM_BADGE_COMMUNITY_HERO = "BADGE_COMMUNITY_HERO";

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

        int lessonPassCount = (int) ownedItems.stream()
                .filter(i -> "LESSON_PASS".equals(i.getItemType()))
                .count();

        List<StoreCatalogResult.StoreItemDto> items = List.of(
                new StoreCatalogResult.StoreItemDto(
                        ITEM_AI_BONUS_3,
                        "AI_QUOTA",
                        "+3 Lượt luyện AI Camera",
                        "Thêm 3 lượt chấm cử chỉ camera AI khi bạn đã dùng hết hạn mức miễn phí trong ngày.",
                        50,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_AI_BONUS_10,
                        "AI_QUOTA",
                        "+10 Lượt luyện AI Camera (Gói Tiết Kiệm)",
                        "Thêm 10 lượt chấm cử chỉ AI camera, thỏa sức thực hành sửa sai cử chỉ tay.",
                        130,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_LESSON_UNLOCK_1,
                        "LESSON_UNLOCK",
                        "Vé mở khóa 1 bài học (Lesson Pass)",
                        "Mở khóa ngay 1 bài học tiếp theo hoặc bài học nâng cao mà không cần chờ đợi.",
                        80,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_LESSON_UNLOCK_UNIT,
                        "LESSON_UNLOCK",
                        "Thẻ thông hành Chuyên đề (Unit Pass)",
                        "Mở khóa toàn bộ chuyên đề bài học tiếp theo, tự do khám phá kho ký hiệu theo sở thích.",
                        220,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_STREAK_FREEZE,
                        "STREAK",
                        "Băng bảo vệ chuỗi Streak",
                        "Tự động bảo vệ chuỗi ngày học của bạn nếu lỡ quên học một ngày (tối đa giữ 3 băng).",
                        100,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_EXP_BOOSTER,
                        "BOOSTER",
                        "Bùa nhân đôi x2 EXP (24 Giờ)",
                        "Gấp đôi toàn bộ điểm EXP nhận được khi hoàn thành bài học và câu hỏi trong 24 giờ tới.",
                        120,
                        false
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_BADGE_AMBASSADOR,
                        "BADGE",
                        "Huy hiệu Đại sứ VSL",
                        "Huy hiệu danh dự vinh danh học viên nhiệt huyết lan tỏa ngôn ngữ ký hiệu Việt Nam.",
                        150,
                        ownedBadges.contains(ITEM_BADGE_AMBASSADOR)
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_BADGE_PERSISTENCE,
                        "BADGE",
                        "Huy hiệu Đôi tay kiên trì",
                        "Huy hiệu ghi nhận sự chuyên cần và nỗ lực bền bỉ trên hành trình học ngôn ngữ ký hiệu.",
                        200,
                        ownedBadges.contains(ITEM_BADGE_PERSISTENCE)
                ),
                new StoreCatalogResult.StoreItemDto(
                        ITEM_BADGE_COMMUNITY_HERO,
                        "BADGE",
                        "Huy hiệu Người thắp sáng cộng đồng",
                        "Huy hiệu đặc biệt dành cho học viên xuất sắc cùng chung tay thắp sáng cầu nối giao tiếp.",
                        300,
                        ownedBadges.contains(ITEM_BADGE_COMMUNITY_HERO)
                )
        );

        return new StoreCatalogResult(expBalance, aiBonusQuota, freezeCount, lessonPassCount, items, ownedBadges);
    }

    @Transactional
    public RedeemStoreItemResult redeem(UUID userId, RedeemStoreItemRequest request) {
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        String itemKey = request.getItemKey();
        int cost;
        String itemType;
        String successMessage;

        switch (itemKey) {
            case ITEM_AI_BONUS_3 -> {
                cost = 50;
                itemType = "AI_QUOTA";
                successMessage = "Đổi thành công +3 lượt luyện camera AI.";
            }
            case ITEM_AI_BONUS_10 -> {
                cost = 130;
                itemType = "AI_QUOTA";
                successMessage = "Đổi thành công +10 lượt luyện camera AI.";
            }
            case ITEM_LESSON_UNLOCK_1 -> {
                cost = 80;
                itemType = "LESSON_PASS";
                successMessage = "Đổi thành công Vé mở khóa 1 bài học.";
            }
            case ITEM_LESSON_UNLOCK_UNIT -> {
                cost = 220;
                itemType = "LESSON_PASS";
                successMessage = "Đổi thành công Thẻ thông hành Chuyên đề Unit.";
            }
            case ITEM_STREAK_FREEZE -> {
                cost = 100;
                itemType = "STREAK";
                successMessage = "Đổi thành công 1 băng bảo vệ chuỗi Streak.";
            }
            case ITEM_EXP_BOOSTER -> {
                cost = 120;
                itemType = "BOOSTER";
                successMessage = "Đổi thành công Bùa nhân đôi x2 EXP (24 Giờ).";
            }
            case ITEM_BADGE_AMBASSADOR -> {
                cost = 150;
                itemType = "BADGE";
                successMessage = "Mở khóa thành công Huy hiệu Đại sứ VSL!";
            }
            case ITEM_BADGE_PERSISTENCE -> {
                cost = 200;
                itemType = "BADGE";
                successMessage = "Mở khóa thành công Huy hiệu Đôi tay kiên trì!";
            }
            case ITEM_BADGE_COMMUNITY_HERO -> {
                cost = 300;
                itemType = "BADGE";
                successMessage = "Mở khóa thành công Huy hiệu Người thắp sáng cộng đồng!";
            }
            default -> throw new BusinessException(ErrorCode.INVALID_PAYLOAD);
        }

        if ("BADGE".equals(itemType) && userInventoryRepository.existsByUserIdAndItemTypeAndItemKey(userId, itemType, itemKey)) {
            throw new BusinessException(ErrorCode.ITEM_ALREADY_OWNED);
        }

        if (profile.getExpBalance() < cost) {
            throw new BusinessException(ErrorCode.EXP_INSUFFICIENT);
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
            List<Streak> streaks = streakRepository.findByUserId(userId);
            if (!streaks.isEmpty()) {
                Streak streak = streaks.get(0);
                streak.setFreezeCount((short) Math.min(3, streak.getFreezeCount() + 1));
                streakRepository.save(streak);
                newFreezeCount = streak.getFreezeCount();
            } else {
                newFreezeCount = 1;
            }
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

        int newLessonPassCount = (int) userInventoryRepository.findByUserIdAndItemType(userId, "LESSON_PASS").size();

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
                newLessonPassCount,
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
