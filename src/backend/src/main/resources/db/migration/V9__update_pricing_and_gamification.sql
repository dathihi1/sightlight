-- V9__update_pricing_and_gamification.sql
-- 1. Cập nhật các gói cước Premium mới: 1 tháng 29k, 6 tháng 100k, Vĩnh viễn 350k
UPDATE plan
SET name = 'Gói Premium 1 Tháng',
    price_vnd = 29000,
    duration_days = 30,
    description = 'Không giới hạn camera AI, 100% không quảng cáo, video tua chậm và đa góc quay trong 30 ngày.',
    is_active = true
WHERE id = 'PREMIUM_1M';

UPDATE plan
SET name = 'Gói Premium 6 Tháng',
    price_vnd = 100000,
    duration_days = 180,
    description = 'Tiết kiệm 43%, không giới hạn camera AI, không quảng cáo trong 6 tháng.',
    is_active = true
WHERE id = 'PREMIUM_6M';

UPDATE plan
SET is_active = false
WHERE id = 'PREMIUM_1Y';

INSERT INTO plan (id, name, description, duration_days, price_vnd, is_active, created_at)
VALUES (
    'PREMIUM_LIFETIME',
    'Gói Premium Vĩnh Viễn',
    'Sở hữu trọn đời: Không giới hạn camera AI, không quảng cáo, chứng nhận hoàn thành và huy hiệu vàng.',
    36500,
    350000,
    true,
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_days = EXCLUDED.duration_days,
    price_vnd = EXCLUDED.price_vnd,
    is_active = true;

-- 2. Mở khoá toàn bộ 17 Units cho tất cả người học
UPDATE unit SET is_free = true;

-- 3. Bổ sung số dư EXP và lượt AI bonus vào hồ sơ người dùng
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS exp_balance INT NOT NULL DEFAULT 0;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS ai_bonus_quota INT NOT NULL DEFAULT 0;

-- 4. Bảng lưu trữ vật phẩm / huy hiệu mở khóa qua tiệm đổi thưởng EXP
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    item_type VARCHAR(32) NOT NULL,
    item_key VARCHAR(64) NOT NULL,
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_inventory UNIQUE (user_id, item_type, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
