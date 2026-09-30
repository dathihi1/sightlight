-- V11__admin_seed_accounts.sql
-- 1. Tạo tài khoản admin mặc định: admin@signlight.vn / Admin@123456
INSERT INTO app_user (id, email, email_verified_at, password_hash, status, failed_login_count, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@signlight.vn',
    now(),
    '$argon2id$v=19$m=19456,t=2,p=1$81StuibTlomjIOSMIaC4EA$jDw7thBXZZAITD8f//+hJtxVveWC9oa6rgSLe6/EVn0',
    'ACTIVE',
    0,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET 
    status = 'ACTIVE',
    email_verified_at = COALESCE(app_user.email_verified_at, now()),
    password_hash = EXCLUDED.password_hash;

INSERT INTO user_profile (user_id, display_name, timezone, exp_balance, ai_bonus_quota)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Quản trị viên SignLight',
    'Asia/Ho_Chi_Minh',
    9999,
    9999
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preference (user_id, daily_goal_minutes, ui_locale, video_speed, marketing_email_opt_in)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    10,
    'vi',
    1.00,
    false
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_role (user_id, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'ADMIN'),
    ('a0000000-0000-0000-0000-000000000001', 'CONTENT_CREATOR'),
    ('a0000000-0000-0000-0000-000000000001', 'CONTENT_APPROVER'),
    ('a0000000-0000-0000-0000-000000000001', 'LEARNER_FREE')
ON CONFLICT DO NOTHING;

-- 2. Đảm bảo nếu dat2801zz@gmail.com có trong CSDL thì kích hoạt ACTIVE và gán quyền ADMIN
UPDATE app_user 
SET status = 'ACTIVE', email_verified_at = COALESCE(email_verified_at, now())
WHERE email = 'dat2801zz@gmail.com';

INSERT INTO user_role (user_id, role)
SELECT id, 'ADMIN' FROM app_user WHERE email = 'dat2801zz@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_role (user_id, role)
SELECT id, 'CONTENT_CREATOR' FROM app_user WHERE email = 'dat2801zz@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_role (user_id, role)
SELECT id, 'CONTENT_APPROVER' FROM app_user WHERE email = 'dat2801zz@gmail.com'
ON CONFLICT DO NOTHING;
