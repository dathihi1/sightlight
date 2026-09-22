"""Nhãn của mô hình và thuật toán chuẩn hoá `stable_sign_id` (BR-A124).

Thuật toán phải **giống hệt** phía backend Java (`StableSignId.java`) — lệch một ký tự là
nhãn thành mồ côi và người học nhận kết quả vô nghĩa (rủi ro T-11).
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

# 30 nhãn của MVP-30 — nguồn: BRD §3.1. Thứ tự PHẢI khớp `labels.json` của mô hình đã huấn luyện.
MVP30_LABELS: list[str] = [
    "Anh", "Cháu", "Chú", "Chị", "Chủ nhật", "Cái bàn", "Cái chảo", "Cái cửa",
    "Cái đèn", "Cô", "Cậu", "Cửa sổ", "Dễ", "Em", "Giường", "Họ hàng",
    "Máy điều hòa", "Mùa hè", "Mùa khô", "Nghề nghiệp", "Ngày Nhà giáo Việt Nam",
    "Ngân hàng", "Nhà hàng", "Nhà trọ", "Nắng", "Nồi cơm điện", "Quạt (đứng)",
    "Trường học", "Trường Đại học", "Ướt",
]

_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def stable_sign_id(raw_label: str) -> str:
    """`Cái bàn` -> `cai-ban`; `Quạt (đứng)` -> `quat-dung`.

    NFKD -> bỏ dấu tổ hợp -> `đ/Đ` thành `d` -> chữ thường -> gom ký tự lạ thành `-`.
    `đ` phải xử lý riêng vì NFKD **không** tách được dấu gạch ngang của nó.
    """
    text = raw_label.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    return _NON_ALNUM.sub("-", text).strip("-")


def load_labels(model_dir: Path) -> list[str]:
    """Đọc `labels.json` của mô hình; thiếu file thì quay về danh sách MVP-30 mặc định."""
    labels_file = model_dir / "labels.json"
    if labels_file.is_file():
        data = json.loads(labels_file.read_text(encoding="utf-8"))
        if isinstance(data, dict):  # {"0": "Anh", ...} hoặc {"labels": [...]}
            if "labels" in data:
                return list(data["labels"])
            return [data[k] for k in sorted(data, key=int)]
        return list(data)
    return list(MVP30_LABELS)
