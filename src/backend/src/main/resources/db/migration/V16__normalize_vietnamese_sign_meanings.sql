-- Chuẩn hóa các nghĩa sinh tự động và sửa các mục bị gán sai nhóm từ.
UPDATE sign
SET meaning = CASE word
    WHEN 'Anh' THEN 'Anh trai; cách xưng hô với người nam lớn tuổi hơn mình.'
    WHEN 'Cháu' THEN 'Con của anh, chị hoặc em; người thuộc thế hệ sau trong gia đình.'
    WHEN 'Chú' THEN 'Em trai của bố; cách gọi người đàn ông ít tuổi hơn bố.'
    WHEN 'Chồng' THEN 'Người đàn ông trong quan hệ hôn nhân với vợ.'
    WHEN 'Con gái' THEN 'Người con mang giới tính nữ trong gia đình.'
    WHEN 'Con trai' THEN 'Người con mang giới tính nam trong gia đình.'
    WHEN 'Cô' THEN 'Chị hoặc em gái của bố; cách gọi người phụ nữ lớn tuổi hơn mình.'
    WHEN 'Cậu' THEN 'Anh hoặc em trai của mẹ.'
    WHEN 'Dì' THEN 'Chị hoặc em gái của mẹ.'
    WHEN 'Vợ' THEN 'Người phụ nữ trong quan hệ hôn nhân với chồng.'
    WHEN 'Kế toán' THEN 'Người ghi chép, kiểm tra và quản lý thông tin tài chính.'
    WHEN 'Lễ tân' THEN 'Người đón tiếp, hướng dẫn khách tại cơ quan hoặc cơ sở dịch vụ.'
    WHEN 'Nhân viên phục vụ' THEN 'Người phục vụ khách tại nhà hàng, quán ăn hoặc cơ sở dịch vụ.'
    WHEN 'Nhân viên văn phòng' THEN 'Người làm các công việc hành chính hoặc chuyên môn tại văn phòng.'
    WHEN 'Sinh viên' THEN 'Người đang học tại trường đại học hoặc cao đẳng.'
    WHEN 'Thư ký' THEN 'Người hỗ trợ công việc hành chính, sắp xếp lịch và xử lý văn bản.'
    WHEN 'Đầu bếp' THEN 'Người chế biến món ăn trong gia đình hoặc cơ sở ăn uống.'
    WHEN 'Quả địa cầu' THEN 'Mô hình thu nhỏ của Trái Đất, dùng để quan sát vị trí các khu vực địa lý.'
    WHEN 'Quả đào' THEN 'Quả có vỏ mỏng, thịt mềm, thường có vị ngọt hoặc hơi chua.'
    WHEN 'Con trâu' THEN 'Động vật lớn thuộc họ bò, thường được nuôi để kéo cày.'
    WHEN 'Trung thu' THEN 'Tết Trung thu, diễn ra vào ngày rằm tháng Tám âm lịch.'
    ELSE CASE
        WHEN meaning LIKE 'Tính từ miêu tả đặc điểm, tính chất:%'
            THEN 'Từ dùng để miêu tả đặc điểm hoặc trạng thái: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Hành động thực hiện trong đời sống:%'
            THEN 'Động từ chỉ hành động “' || lower(left(word, 1)) || substring(word from 2) || '” trong giao tiếp hoặc sinh hoạt hằng ngày.'
        WHEN meaning LIKE 'Khái niệm chỉ thời gian, mốc lịch hoặc mùa:%'
            THEN 'Từ chỉ thời gian, mốc lịch hoặc mùa: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Vật dụng, thiết bị sinh hoạt gia đình:%'
            THEN 'Tên đồ vật hoặc thiết bị dùng trong sinh hoạt: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Món ăn hoặc thức uống truyền thống:%'
            THEN 'Tên món ăn hoặc thức uống: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Nơi chốn, địa điểm hoặc công trình:%'
            THEN 'Tên nơi chốn, địa điểm hoặc công trình: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Trang phục hoặc đồ dùng phụ kiện:%'
            THEN 'Tên trang phục hoặc phụ kiện: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Cảm xúc, tâm trạng hoặc nhu cầu:%'
            THEN 'Từ diễn tả cảm xúc, tâm trạng hoặc nhu cầu: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Môn thể thao hoặc hoạt động vui chơi giải trí:%'
            THEN 'Tên môn thể thao hoặc hoạt động giải trí: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Loài động vật quen thuộc:%'
            THEN 'Tên một loài động vật: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Loại trái cây tươi ngon:%'
            THEN 'Tên một loại trái cây: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning LIKE 'Ký hiệu biểu thị từ:%'
            THEN 'Từ vựng tiếng Việt: ' || lower(left(word, 1)) || substring(word from 2) || '.'
        WHEN meaning ~ '[.!?…]$' THEN trim(meaning)
        ELSE trim(meaning) || '.'
    END
END
WHERE is_seed = true AND meaning IS NOT NULL AND trim(meaning) <> '';

UPDATE sign
SET description = meaning
WHERE is_seed = true AND meaning IS NOT NULL;

-- Đồng bộ phần nghĩa nằm trong câu hỏi/gợi ý với nghĩa vừa chuẩn hóa.
UPDATE exercise AS e
SET prompt_text = regexp_replace(
        e.prompt_text,
        '\(Nghĩa:[^)]*\)',
        '(Nghĩa: ' || regexp_replace(s.meaning, '[.!?…]+$', '') || ')'
    )
FROM sign AS s
WHERE e.sign_id = s.id
  AND e.is_seed = true
  AND e.prompt_text LIKE '%(Nghĩa:%';

UPDATE exercise AS e
SET prompt_text = regexp_replace(
        e.prompt_text,
        '\(Gợi ý nghĩa:[^)]*\)',
        '(Gợi ý nghĩa: ' || regexp_replace(s.meaning, '[.!?…]+$', '') || ')'
    )
FROM sign AS s
WHERE e.sign_id = s.id
  AND e.is_seed = true
  AND e.prompt_text LIKE '%(Gợi ý nghĩa:%';
