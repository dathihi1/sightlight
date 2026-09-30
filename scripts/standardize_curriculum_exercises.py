# -*- coding: utf-8 -*-
"""
Chuẩn hóa toàn bộ 85 bài học và 1200 bài tập trong VSL:
1. Đảm bảo 100% options (đáp án đúng + đáp án sai) chỉ nằm trong các từ vựng của bài học đó.
2. Thể hiện rõ ý nghĩa của từ trong đề bài (prompt) trước khi người học chọn từ.
3. Cập nhật file vsl-seed.json và đồng bộ trực tiếp vào PostgreSQL.
4. Cập nhật lại tài liệu docs/GIAO_TRINH_17_UNITS_VSL.md.
"""

import json
import os
import sys
import uuid
import psycopg2

def get_distractors(target_word, lesson_words):
    """
    Lấy danh sách các từ gây nhiễu chỉ trong phạm vi bài học (lesson-scoped).
    Nếu bài có 3 từ: 2 distractors (tổng 3 options).
    Nếu bài có 4 từ: 3 distractors (tổng 4 options).
    Nếu bài có 5-6 từ: 3 distractors lấy xoay vòng từ các từ còn lại trong bài.
    """
    other_words = [w for w in lesson_words if w != target_word]
    if len(other_words) <= 3:
        return other_words
    
    # Nếu có nhiều hơn 3 từ khác, chọn 3 từ theo thứ tự xoay vòng cố định
    target_idx = lesson_words.index(target_word)
    distractors = []
    for i in range(1, len(lesson_words)):
        candidate = lesson_words[(target_idx + i) % len(lesson_words)]
        if candidate != target_word and candidate not in distractors:
            distractors.append(candidate)
        if len(distractors) == 3:
            break
    return distractors

def main():
    seed_path = os.path.join("src", "backend", "src", "main", "resources", "seed", "vsl-seed.json")
    with open(seed_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    signs_map = {s["word"]: s for s in data.get("signs", [])}
    units = data.get("units", [])

    total_exercises_updated = 0
    total_options_updated = 0

    print("=== BẮT ĐẦU CHUẨN HÓA BÀI HỌC VÀ BÀI TẬP VSL ===")

    for u in units:
        for ch in u.get("chapters", []):
            for l in ch.get("lessons", []):
                # 1. Thu thập danh sách các từ trong bài
                lesson_words = []
                for ex in l.get("exercises", []):
                    w = ex.get("sign")
                    if w and w not in lesson_words:
                        lesson_words.append(w)

                # 2. Chuẩn hóa từng bài tập trong bài
                for ex in l.get("exercises", []):
                    w = ex.get("sign")
                    if not w:
                        continue
                    
                    s_obj = signs_map.get(w, {})
                    meaning = s_obj.get("meaning", "").strip()
                    if not meaning:
                        meaning = s_obj.get("description", "").strip()
                    if not meaning:
                        meaning = f"Ký hiệu cho từ '{w}'"

                    ex_type = ex.get("type")
                    total_exercises_updated += 1

                    if ex_type == "MEANING_TO_SIGN":
                        # Trước khi chọn từ, cho biết nghĩa của từ đó
                        ex["prompt"] = f"Từ \"{w}\" (Nghĩa: {meaning}) — Hãy chọn ký hiệu/từ đúng:"
                        ex["instructionText"] = "Đọc kỹ ý nghĩa và chọn từ tương ứng trong bài học"
                        distractors = get_distractors(w, lesson_words)
                        ex["options"] = [w] + distractors
                        total_options_updated += len(ex["options"])

                    elif ex_type == "SIGN_TO_MEANING":
                        # Xem video và chọn từ trong bài
                        ex["prompt"] = "Xem video ký hiệu và chọn từ đúng trong bài học:"
                        ex["instructionText"] = "Quan sát cử chỉ tay và khẩu hình rồi chọn từ tương ứng"
                        distractors = get_distractors(w, lesson_words)
                        ex["options"] = [w] + distractors
                        total_options_updated += len(ex["options"])

                    elif ex_type == "TYPE_WHAT_YOU_SEE":
                        ex["prompt"] = f"Xem video ký hiệu và gõ lại từ tương ứng (Gợi ý nghĩa: {meaning}):"
                        ex["instructionText"] = "Quan sát video và gõ chính xác từ tiếng Việt"
                        ex["answer"] = w
                        ex["acceptedAnswers"] = [w, w.lower(), w.strip()]

    # Lưu lại vsl-seed.json
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"-> Đã chuẩn hóa {total_exercises_updated} bài tập và {total_options_updated} options trong {seed_path}")

    # Đồng bộ vào PostgreSQL
    print("-> Đang đồng bộ chính xác theo (lesson_id, order_index) vào PostgreSQL...")
    conn = psycopg2.connect("postgresql://signlight:signlight@localhost:5432/signlight")
    cur = conn.cursor()

    db_updated_ex = 0
    db_updated_opt = 0

    for u in units:
        for ch in u.get("chapters", []):
            for l in ch.get("lessons", []):
                cur.execute("SELECT id FROM lesson WHERE title = %s", (l.get("title"),))
                res = cur.fetchone()
                if not res:
                    print(f"WARNING: Không tìm thấy lesson '{l.get('title')}' trong DB!")
                    continue
                lesson_id = res[0]

                for ex_idx, ex in enumerate(l.get("exercises", [])):
                    cur.execute(
                        "SELECT id FROM exercise WHERE lesson_id = %s AND order_index = %s",
                        (lesson_id, ex_idx)
                    )
                    ex_res = cur.fetchone()
                    if not ex_res:
                        print(f"WARNING: Không tìm thấy exercise index {ex_idx} của lesson '{l.get('title')}'!")
                        continue
                    
                    exercise_id = ex_res[0]
                    db_updated_ex += 1

                    # Cập nhật exercise
                    cur.execute("""
                        UPDATE exercise
                        SET prompt_text = %s,
                            instruction_text = %s,
                            correct_answer_text = %s,
                            accepted_answers = %s
                        WHERE id = %s
                    """, (
                        ex.get("prompt"),
                        ex.get("instructionText"),
                        ex.get("answer"),
                        json.dumps(ex.get("acceptedAnswers", [])),
                        exercise_id
                    ))

                    # Cập nhật options nếu có
                    if "options" in ex:
                        cur.execute("DELETE FROM exercise_option WHERE exercise_id = %s", (exercise_id,))
                        options_list = ex.get("options", [])
                        for opt_idx, opt_text in enumerate(options_list):
                            is_corr = (opt_idx == 0)
                            cur.execute("""
                                INSERT INTO exercise_option (id, exercise_id, order_index, label_text, is_correct, is_seed)
                                VALUES (%s, %s, %s, %s, %s, %s)
                            """, (
                                str(uuid.uuid4()),
                                exercise_id,
                                opt_idx,
                                opt_text,
                                is_corr,
                                True
                            ))
                            db_updated_opt += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"-> Đã đồng bộ vào PostgreSQL thành công: {db_updated_ex} bài tập và {db_updated_opt} options.")

    # Cập nhật tài liệu docs/GIAO_TRINH_17_UNITS_VSL.md
    print("-> Đang cập nhật tài liệu giáo trình docs/GIAO_TRINH_17_UNITS_VSL.md...")
    generate_markdown_doc(data, signs_map)
    print("=== HOÀN TẤT CHUẨN HÓA ===")

def generate_markdown_doc(data, signs_map):
    units = data.get("units", [])
    out_lines = []
    out_lines.append("# BẢNG QUY CHUẨN TOÀN BỘ GIÁO TRÌNH 17 UNITS VSL (400 TỪ VỰNG)")
    out_lines.append("")
    out_lines.append("> **Quy chuẩn sư phạm Signlight VSL:**")
    out_lines.append("> 1. **Bước 1 — Xem video & nghĩa của từ (`SIGN_CARD`):** Người học quan sát video mẫu chuyển động tay (hỗ trợ tua 0.5x, 0.75x, lặp lại) và nắm chắc ý nghĩa từ trước khi làm bài tập.")
    out_lines.append("> 2. **Phạm vi đáp án (Lesson-scoped options):** Toàn bộ các lựa chọn (đáp án đúng và các phương án gây nhiễu) trong bài tập trắc nghiệm **CHỈ ĐƯỢC LẤY TỪ DANH SÁCH CÁC TỪ VỰNG CỦA CHÍNH BÀI ĐÓ**, không lẫn từ bài khác.")
    out_lines.append("> 3. **Trước khi chọn từ:** Đề bài luôn thể hiện rõ nghĩa giải thích của từ vựng để định hướng ngữ cảnh cho người học.")
    out_lines.append("")
    out_lines.append("---")
    out_lines.append("")
    out_lines.append("## 1. MỤC LỤC TỔNG QUAN 17 UNITS")
    out_lines.append("")
    out_lines.append("| Unit | Tên chuyên đề lớn | Phân quyền | Số chương | Số bài học | Số từ vựng |")
    out_lines.append("| :---: | :--- | :---: | :---: | :---: | :---: |")

    total_all_lessons = 0
    total_all_signs = 0

    for idx, u in enumerate(units):
        chaps = u.get("chapters", [])
        total_l = sum(len(ch.get("lessons", [])) for ch in chaps)
        total_all_lessons += total_l
        u_signs = []
        for ch in chaps:
            for l in ch.get("lessons", []):
                for ex in l.get("exercises", []):
                    w = ex.get("sign")
                    if w and w not in u_signs:
                        u_signs.append(w)
        total_all_signs += len(u_signs)
        free_label = "Miễn phí (Free)" if u.get("free") else "Gói Premium"
        out_lines.append(f"| {idx+1} | {u.get('title')} | {free_label} | {len(chaps)} | {total_l} | {len(u_signs)} |")

    out_lines.append(f"| **TỔNG** | **17 Units chuyên đề** | **1 Free / 16 Premium** | | **{total_all_lessons} bài** | **{total_all_signs} từ** |")
    out_lines.append("")
    out_lines.append("---")
    out_lines.append("")
    out_lines.append("## 2. CHI TIẾT TỪNG UNIT, BÀI HỌC VÀ CẤU TRÚC BÀI TẬP")
    out_lines.append("")

    for idx, u in enumerate(units):
        u_title = u.get("title")
        u_free = "Miễn phí (Free)" if u.get("free") else "Gói Premium"
        out_lines.append(f"### 🗂️ UNIT {idx+1}: {u_title}")
        out_lines.append(f"- **Phân quyền truy cập:** {u_free}")
        out_lines.append(f"- **Số chương:** {len(u.get('chapters', []))}")
        out_lines.append("")

        for ch_idx, ch in enumerate(u.get("chapters", [])):
            ch_title = ch.get("title")
            out_lines.append(f"#### 📁 {ch_title}")
            out_lines.append("")

            for l_idx, l in enumerate(ch.get("lessons", [])):
                l_title = l.get("title")
                l_mins = l.get("estimatedMinutes", 5)
                exs = l.get("exercises", [])

                l_signs = []
                for ex in exs:
                    w = ex.get("sign")
                    if w and w not in [s["word"] for s in l_signs]:
                        s_obj = signs_map.get(w, {})
                        l_signs.append({
                            "word": w,
                            "meaning": s_obj.get("meaning", "Chưa có chú giải"),
                            "topic": s_obj.get("topic", ""),
                            "wordClass": s_obj.get("wordClass", ""),
                            "videoId": s_obj.get("video", {}).get("videoId", ""),
                            "objectKey": s_obj.get("video", {}).get("objectKey", "")
                        })

                out_lines.append(f"##### 📖 Bài {l_idx+1}: {l_title}")
                out_lines.append(f"- **Thời lượng:** ~{l_mins} phút | **Số bài tập:** {len(exs)} bài")
                out_lines.append(f"- **Các từ vựng trong bài ({len(l_signs)} từ):** " + ", ".join([f"**{s['word']}**" for s in l_signs]))
                out_lines.append("")
                out_lines.append("**Bảng từ vựng chi tiết & liên kết Video:**")
                out_lines.append("")
                out_lines.append("| STT | Từ vựng | Ý nghĩa / Giải thích | Từ loại | Video ID | Video R2 |")
                out_lines.append("| :---: | :--- | :--- | :---: | :---: | :--- |")

                for s_idx, s in enumerate(l_signs):
                    out_lines.append(f"| {s_idx+1} | **{s['word']}** | {s['meaning']} | {s['wordClass']} | `{s['videoId']}` | `{s['objectKey']}` |")

                out_lines.append("")
                out_lines.append("**Chuỗi bài tập luyện tập trong bài (Options chỉ lấy trong bài học này):**")
                out_lines.append("")
                out_lines.append("| STT | Dạng bài | Từ vựng | Đề bài (Prompt) | Các phương án lựa chọn (Options) | Đáp án đúng |")
                out_lines.append("| :---: | :--- | :--- | :--- | :--- | :--- |")

                for e_idx, ex in enumerate(exs):
                    ex_type = ex.get("type", "")
                    ex_sign = ex.get("sign", "")
                    ex_prompt = ex.get("prompt", "")
                    ex_opts = ex.get("options", [])
                    ex_ans = ex.get("answer", "")
                    if not ex_ans and ex_opts:
                        ex_ans = ex_opts[0]
                    opts_str = ", ".join(ex_opts) if ex_opts else f"Gõ từ: `{ex_ans}`"
                    out_lines.append(f"| {e_idx+1} | `{ex_type}` | **{ex_sign}** | {ex_prompt} | {opts_str} | **{ex_ans}** |")

                out_lines.append("")

        out_lines.append("---")
        out_lines.append("")

    doc_path = os.path.join("docs", "GIAO_TRINH_17_UNITS_VSL.md")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))
    print(f"-> Đã ghi thành công tài liệu: {doc_path}")

if __name__ == "__main__":
    main()
