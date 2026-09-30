# -*- coding: utf-8 -*-
"""
Trích xuất toàn bộ 17 Units và 85 bài học trong vsl-seed.json thành file Markdown chi tiết:
docs/GIAO_TRINH_17_UNITS_VSL.md
"""

import json
import os
import sys

def main():
    seed_path = os.path.join("src", "backend", "src", "main", "resources", "seed", "vsl-seed.json")
    with open(seed_path, encoding="utf-8") as f:
        d = json.load(f)

    signs_map = {s["word"]: s for s in d.get("signs", [])}
    units = d.get("units", [])

    out_lines = []
    out_lines.append("# BẢNG TRÍCH XUẤT TOÀN BỘ GIÁO TRÌNH 17 UNITS VSL (400 TỪ VỰNG)")
    out_lines.append("")
    out_lines.append("> **Mục đích:** Tài liệu trích xuất hiện trạng toàn bộ 17 Units, 85 bài học và 400 ký hiệu VSL để bạn tiến hành rà soát, tái cấu trúc bài học và chuẩn hóa nội dung.")
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
    out_lines.append("## 2. CHI TIẾT TỪNG UNIT, CHƯƠNG VÀ BÀI HỌC")
    out_lines.append("")

    for idx, u in enumerate(units):
        u_title = u.get("title")
        u_free = "Miễn phí" if u.get("free") else "Gói Premium"
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
                out_lines.append(f"- **Thời lượng:** ~{l_mins} phút | **Số bài tập:** {len(exs)} câu trắc nghiệm/gõ chữ")
                out_lines.append(f"- **Danh sách {len(l_signs)} từ vựng trong bài:**")
                out_lines.append("")
                out_lines.append("| STT | Từ vựng VSL | Ý nghĩa / Giải thích | Từ loại | Video ID | Đường dẫn video R2 |")
                out_lines.append("| :---: | :--- | :--- | :---: | :---: | :--- |")

                for s_idx, s in enumerate(l_signs):
                    out_lines.append(f"| {s_idx+1} | **{s['word']}** | {s['meaning']} | {s['wordClass']} | `{s['videoId']}` | `{s['objectKey']}` |")

                out_lines.append("")

        out_lines.append("---")
        out_lines.append("")

    os.makedirs("docs", exist_ok=True)
    out_file = os.path.join("docs", "GIAO_TRINH_17_UNITS_VSL.md")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(out_lines))

    print(f"DONE! Wrote {len(out_lines)} lines to {out_file}")

if __name__ == "__main__":
    main()
