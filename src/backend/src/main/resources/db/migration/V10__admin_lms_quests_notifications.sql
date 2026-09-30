-- V10__admin_lms_quests_notifications.sql
-- 1. Nhiệm vụ và tiến độ hoàn thành nhiệm vụ của người học
CREATE TABLE IF NOT EXISTS quest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    quest_type VARCHAR(20) NOT NULL DEFAULT 'DAILY',
    target_action VARCHAR(50) NOT NULL,
    target_count INT NOT NULL DEFAULT 1,
    reward_exp INT NOT NULL DEFAULT 20,
    reward_ai_bonus INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
    current_count INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    reset_date DATE NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_quest_date UNIQUE (user_id, quest_id, reset_date)
);

CREATE INDEX IF NOT EXISTS idx_uqp_user_date ON user_quest_progress (user_id, reset_date);
CREATE INDEX IF NOT EXISTS idx_quest_active_type ON quest (is_active, quest_type);

-- 2. Hệ thống thông báo in-app
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    target_url VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notification (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notification (user_id, created_at DESC);

-- 3. Hỗ trợ sắp xếp lại thứ tự bài tập và blocks (DEFERRABLE constraint cho reordering)
ALTER TABLE exercise DROP CONSTRAINT IF EXISTS uq_exercise_order;
ALTER TABLE exercise ADD CONSTRAINT uq_exercise_order UNIQUE (lesson_id, order_index) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE lesson_content_block DROP CONSTRAINT IF EXISTS uq_lesson_block_order;
ALTER TABLE lesson_content_block ADD CONSTRAINT uq_lesson_block_order UNIQUE (lesson_id, order_index) DEFERRABLE INITIALLY DEFERRED;

-- 4. Seed dữ liệu mẫu cho nhiệm vụ ngày
INSERT INTO quest (id, title, description, quest_type, target_action, target_count, reward_exp, reward_ai_bonus, is_active, order_index)
VALUES 
    ('11111111-1111-1111-1111-111111111001', 'Khởi động ngày mới', 'Hoàn thành 1 bài học bất kỳ trong lộ trình', 'DAILY', 'COMPLETE_LESSON', 1, 25, 0, true, 1),
    ('11111111-1111-1111-1111-111111111002', 'Luyện tập cùng AI', 'Thực hành nhận diện camera AI 2 lần', 'DAILY', 'PRACTICE_AI', 2, 35, 2, true, 2),
    ('11111111-1111-1111-1111-111111111003', 'Ký hiệu hoàn hảo', 'Đạt điểm số 100% trong một bài học bất kỳ', 'DAILY', 'SCORE_PERFECT', 1, 30, 0, true, 3)
ON CONFLICT (id) DO NOTHING;
