-- V17: Gói tri ân 0đ 1 tháng nhận feedback và hệ thống Gift Code nhận quà
-- 1. Bổ sung gói tri ân 0đ thời hạn 30 ngày
INSERT INTO plan (id, name, description, duration_days, price_vnd, is_active)
VALUES (
    'PREMIUM_TRIAN_1M',
    'SignLight Premium Tri Ân',
    'Gói tri ân 1 tháng (30 ngày) trải nghiệm trọn vẹn Premium giá 0đ để nhận góp ý và đánh giá hoàn thiện sản phẩm.',
    30,
    0,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_days = EXCLUDED.duration_days,
    price_vnd = EXCLUDED.price_vnd,
    is_active = true;

-- 2. Bảng quản lý Gift Code nhận quà
CREATE TABLE IF NOT EXISTS gift_code (
    code VARCHAR(32) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    premium_days INT NOT NULL DEFAULT 0,
    ai_quota INT NOT NULL DEFAULT 0,
    exp_reward INT NOT NULL DEFAULT 0,
    max_uses INT NOT NULL DEFAULT -1,
    used_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bảng lịch sử nhận quà từ Gift Code (mỗi user chỉ nhận 1 lần cho mỗi mã)
CREATE TABLE IF NOT EXISTS gift_code_redemption (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL REFERENCES gift_code(code) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_gift_code_user UNIQUE (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_gift_code_redemption_user ON gift_code_redemption(user_id);

-- 4. Bảng lưu trữ feedback / góp ý từ người dùng khi trải nghiệm gói tri ân
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    rating INT NOT NULL DEFAULT 5,
    category VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

-- 5. Seed các mã quà tặng tri ân ban đầu
INSERT INTO gift_code (code, title, description, premium_days, ai_quota, exp_reward, max_uses, is_active)
VALUES
    ('TRIAN2026', 'Quà Tri Ân Người Dùng', 'Nhận ngay +10 lượt luyện AI và +150 EXP để trải nghiệm trọn vẹn.', 0, 10, 150, -1, true),
    ('FEEDBACK', 'Quà Tặng Góp Ý & Feedback', 'Tặng 7 ngày Premium, +5 lượt AI cùng +200 EXP cho học viên gửi feedback.', 7, 5, 200, -1, true),
    ('SIGNLIGHTVIP', 'Quà Tặng Tân Thủ Khởi Đầu', 'Tặng +5 lượt luyện Camera AI và +100 EXP.', 0, 5, 100, -1, true)
ON CONFLICT (code) DO NOTHING;
