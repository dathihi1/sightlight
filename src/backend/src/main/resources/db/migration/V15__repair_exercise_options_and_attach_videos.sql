-- Sửa dữ liệu seed cũ: đáp án trắc nghiệm luôn là phần tử đầu trong file seed.
-- Thứ tự trả về cho client được xáo độc lập trong LessonService.
UPDATE exercise_option option_row
SET is_correct = (option_row.order_index = 0)
FROM exercise exercise_row
WHERE option_row.exercise_id = exercise_row.id
  AND option_row.is_seed = true
  AND exercise_row.is_seed = true
  AND exercise_row.type IN ('SIGN_TO_MEANING', 'MEANING_TO_SIGN');

-- Gắn video chính cho từng lựa chọn theo nhãn trong cùng khoá học.
-- Dùng cho bài "chọn ký hiệu" và "nối ký hiệu - ý nghĩa".
UPDATE exercise_option option_row
SET sign_video_id = matched.video_id
FROM (
    SELECT DISTINCT ON (option_inner.id)
           option_inner.id AS option_id,
           video.id AS video_id
    FROM exercise_option option_inner
    JOIN exercise exercise_row ON exercise_row.id = option_inner.exercise_id
    JOIN lesson lesson_row ON lesson_row.id = exercise_row.lesson_id
    JOIN chapter chapter_row ON chapter_row.id = lesson_row.chapter_id
    JOIN unit unit_row ON unit_row.id = chapter_row.unit_id
    JOIN sign sign_row
      ON sign_row.course_id = unit_row.course_id
     AND sign_row.word = option_inner.label_text
     AND sign_row.status = 'PUBLISHED'
    JOIN sign_video video
      ON video.sign_id = sign_row.id
    WHERE option_inner.is_seed = true
      AND exercise_row.is_seed = true
      AND exercise_row.type IN ('MEANING_TO_SIGN', 'MATCH_SIGN_MEANING')
    ORDER BY option_inner.id, video.is_primary DESC, video.id
) matched
WHERE option_row.id = matched.option_id;
