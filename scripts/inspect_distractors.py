# -*- coding: utf-8 -*-
import json

with open("src/backend/src/main/resources/seed/vsl-seed.json", encoding="utf-8") as f:
    d = json.load(f)

total_choice_ex = 0
total_with_out_of_lesson = 0

for u in d["units"]:
    for ch in u["chapters"]:
        for l in ch["lessons"]:
            l_words = []
            for ex in l["exercises"]:
                w = ex.get("sign")
                if w and w not in l_words:
                    l_words.append(w)
            
            for ex in l["exercises"]:
                if "options" in ex:
                    total_choice_ex += 1
                    opts = ex["options"]
                    out = [o for o in opts if o not in l_words]
                    if out:
                        total_with_out_of_lesson += 1

print(f"Tổng số câu trắc nghiệm (options): {total_choice_ex}")
print(f"Số câu trắc nghiệm có đáp án lấy ngoài bài học: {total_with_out_of_lesson}")

# In ví dụ 1 bài
l0 = d["units"][0]["chapters"][0]["lessons"][0]
l0_words = [ex["sign"] for ex in l0["exercises"] if "sign" in ex]
unique_l0_words = list(dict.fromkeys(l0_words))
print(f"\nVí dụ bài: {l0['title']}")
print(f"Các từ trong bài ({len(unique_l0_words)} từ): {unique_l0_words}")
for ex in l0["exercises"][:6]:
    if "options" in ex:
        print(f"  [{ex['type']}] Từ: {ex.get('sign')}")
        print(f"    Đề bài (prompt): {ex.get('prompt')}")
        print(f"    Options: {ex.get('options')}")
