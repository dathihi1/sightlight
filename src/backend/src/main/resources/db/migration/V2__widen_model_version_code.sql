-- V2 — Nới `ai_model_version.version_code` từ VARCHAR(32) lên VARCHAR(64).
--
-- Lý do: dịch vụ AI gắn hậu tố `-stub` khi chạy không có trọng số mô hình, làm mã phiên bản
-- `vsl-mvp30-v2-lite-transformer-stub` dài 34 ký tự — vượt giới hạn 32 của LLD §1.7b.
--
-- Vì sao không bỏ hậu tố cho vừa 32 ký tự: hậu tố là thứ khiến dữ liệu sinh ra ở chế độ mô phỏng
-- **phân biệt được vĩnh viễn** trong CSDL. Nếu ghi chung mã với mô hình thật thì sau này không ai
-- tách được lượt thử nào đến từ kết quả giả lập — đúng thứ GATE-4 cần chứng minh là không có.
--
-- ⚠️ Cần đồng bộ lại LLD.md §1.7b (VARCHAR(32) -> VARCHAR(64)) ở lần cập nhật tài liệu kế tiếp.

ALTER TABLE ai_model_version ALTER COLUMN version_code TYPE VARCHAR(64);
