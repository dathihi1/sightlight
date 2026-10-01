-- V12__add_weekly_milestone_quests.sql
-- Thêm các nhiệm vụ Tuần và Cột mốc để hệ thống EXP phong phú và chuẩn xác

INSERT INTO quest (id, title, description, quest_type, target_action, target_count, reward_exp, reward_ai_bonus, is_active, order_index)
VALUES 
    ('11111111-1111-1111-1111-111111112001', 'Chuyên cần cả tuần', 'Hoàn thành 5 bài học VSL trong tuần này', 'WEEKLY', 'COMPLETE_LESSON', 5, 100, 2, true, 10),
    ('11111111-1111-1111-1111-111111112002', 'Chiến binh AI', 'Luyện tập nhận diện cử chỉ trước Camera AI 8 lần trong tuần', 'WEEKLY', 'PRACTICE_AI', 8, 120, 5, true, 11),
    ('11111111-1111-1111-1111-111111113001', 'Hành trình mở lối', 'Chinh phục 10 bài học đầu tiên trên con đường VSL', 'MILESTONE', 'COMPLETE_LESSON', 10, 200, 5, true, 20),
    ('11111111-1111-1111-1111-111111113002', 'Đôi tay vàng', 'Đạt điểm số tuyệt đối 100% trong 5 bài học', 'MILESTONE', 'SCORE_PERFECT', 5, 150, 3, true, 21)
ON CONFLICT (id) DO NOTHING;
