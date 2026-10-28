-- Chuẩn hoá mô hình thương mại:
--   * VND chỉ dùng cho 3 gói Premium: 1 tháng, 6 tháng, vĩnh viễn.
--   * Toàn bộ 17 chủ đề miễn phí; bài học vẫn mở tuần tự trong từng chủ đề.
--   * EXP chỉ dùng cho vật phẩm hỗ trợ, không quy đổi ngang với VND.

UPDATE plan
SET is_active = false
WHERE id IN ('PREMIUM_1Y', 'LESSON_RENT_1M', 'LESSON_PERMANENT');

UPDATE plan
SET name = 'SignLight Premium 1 Tháng',
    description = 'Luyện Camera AI không giới hạn trong 30 ngày.',
    duration_days = 30,
    price_vnd = 29000,
    is_active = true
WHERE id = 'PREMIUM_1M';

UPDATE plan
SET name = 'SignLight Premium 6 Tháng',
    description = 'Luyện Camera AI không giới hạn trong 180 ngày, tiết kiệm 43% so với mua từng tháng.',
    duration_days = 180,
    price_vnd = 100000,
    is_active = true
WHERE id = 'PREMIUM_6M';

UPDATE plan
SET name = 'SignLight Premium Vĩnh Viễn',
    description = 'Sử dụng các quyền lợi Premium không giới hạn thời gian.',
    duration_days = 36500,
    price_vnd = 350000,
    is_active = true
WHERE id = 'PREMIUM_LIFETIME';

UPDATE unit SET is_free = true;

-- Vật phẩm tiêu hao (lượt AI, băng streak) phải được mua nhiều lần.
-- Huy hiệu vẫn được chống mua trùng bằng partial unique index và kiểm tra nghiệp vụ.
ALTER TABLE user_inventory DROP CONSTRAINT IF EXISTS uq_user_inventory;
DROP INDEX IF EXISTS uq_user_inventory_badge;
CREATE UNIQUE INDEX uq_user_inventory_badge
    ON user_inventory (user_id, item_type, item_key)
    WHERE item_type = 'BADGE';

-- Quảng cáo chỉ bổ sung lượt AI, tối đa 3 phần thưởng/ngày để không làm mất giá trị Premium.
CREATE TABLE ad_reward_claim (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    reward_date_local DATE NOT NULL,
    reward_type VARCHAR(20) NOT NULL,
    placement VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ad_reward_claim_daily
    ON ad_reward_claim (user_id, reward_date_local);
