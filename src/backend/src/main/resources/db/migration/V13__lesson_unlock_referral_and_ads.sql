-- V13__lesson_unlock_referral_and_ads.sql
-- 1. Mở khóa bài học lẻ bằng EXP hoặc PayOS (thuê 1 tháng hoặc vĩnh viễn)
CREATE TABLE IF NOT EXISTS user_unlocked_lesson (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lesson(id) ON DELETE CASCADE,
    unlock_type VARCHAR(20) NOT NULL, -- 'RENT_1M', 'PERMANENT'
    paid_by VARCHAR(20) NOT NULL,     -- 'VND', 'EXP'
    amount INT NOT NULL,              -- 5000 hoặc 25000
    expires_at TIMESTAMPTZ,           -- null nếu PERMANENT, now() + 30 days nếu RENT_1M
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_lesson_unlock UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_uul_user ON user_unlocked_lesson(user_id);
CREATE INDEX IF NOT EXISTS idx_uul_lesson ON user_unlocked_lesson(lesson_id);

-- 2. Hệ thống giới thiệu bạn bè (Referral)
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS referral_reward_claimed BOOLEAN NOT NULL DEFAULT false;

-- Tạo unique index cho referral_code (cho phép null nếu chưa sinh)
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_user_referral_code ON app_user(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_user_referred_by ON app_user(referred_by_user_id);

-- Tự động sinh mã referral cho các user hiện có chưa có mã
UPDATE app_user 
SET referral_code = UPPER(SUBSTRING(MD5(id::text || email) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 3. Bổ sung gói cước mở khóa bài học lẻ (5k / 25k) vào bảng plan
INSERT INTO plan (id, name, description, duration_days, price_vnd, is_active, created_at)
VALUES
    ('LESSON_RENT_1M', 'Mở khóa 1 bài học (Thuê 30 ngày)', 'Mở khóa và học 1 bài học bất kỳ trong 30 ngày', 30, 5000, true, now()),
    ('LESSON_PERMANENT', 'Mở khóa vĩnh viễn 1 bài học', 'Sở hữu trọn đời quyền truy cập bài học', 36500, 25000, true, now())
ON CONFLICT (id) DO UPDATE SET
    price_vnd = EXCLUDED.price_vnd,
    is_active = true;

-- 4. Bổ sung nhiệm vụ xem quảng cáo nhận thưởng
INSERT INTO quest (id, title, description, quest_type, target_action, target_count, reward_exp, reward_ai_bonus, is_active, order_index)
VALUES 
    ('11111111-1111-1111-1111-111111111004', 'Xem video nhận quà', 'Xem 1 video ngắn nhận ngay lượt Camera AI và EXP', 'DAILY', 'WATCH_AD', 1, 30, 1, true, 4)
ON CONFLICT (id) DO NOTHING;

