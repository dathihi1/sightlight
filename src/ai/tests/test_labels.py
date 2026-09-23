"""Bộ test chung cho thuật toán `stable_sign_id` (BR-A124, AC-44.2).

Bảng dữ liệu dưới đây **giống hệt** `StableSignIdTest.java` ở backend. Đây là biện pháp giảm thiểu
rủi ro **T-11**: hai phía chuẩn hoá lệch nhau thì nhãn thành mồ côi và người học nhận kết quả vô
nghĩa mà không có lỗi nào được ném ra. Sửa một bên là phải sửa cả hai.
"""

from __future__ import annotations

import pytest

from app.labels import MVP30_LABELS, stable_sign_id


def test_api_module_registers_labels_route_without_response_model_error() -> None:
    from app.main import app

    labels_route = next(route for route in app.routes if route.path == "/api/labels")

    assert labels_route.response_model is None


@pytest.mark.parametrize(
    ("raw_label", "expected"),
    [
        ("Anh", "anh"),
        ("Chị", "chi"),
        ("Cháu", "chau"),
        ("Cậu", "cau"),
        ("Họ hàng", "ho-hang"),
        ("Cái bàn", "cai-ban"),
        ("Cái cửa", "cai-cua"),
        ("Cái đèn", "cai-den"),
        ("Cửa sổ", "cua-so"),
        ("Giường", "giuong"),
        ("Nồi cơm điện", "noi-com-dien"),
        ("Máy điều hòa", "may-dieu-hoa"),
        ("Quạt (đứng)", "quat-dung"),
        ("Trường Đại học", "truong-dai-hoc"),
        ("Ngày Nhà giáo Việt Nam", "ngay-nha-giao-viet-nam"),
        ("Ướt", "uot"),
        ("Dễ", "de"),
    ],
)
def test_normalizes_vietnamese_labels(raw_label: str, expected: str) -> None:
    assert stable_sign_id(raw_label) == expected


@pytest.mark.parametrize(
    ("raw_label", "expected"),
    [("Đường", "duong"), ("đường", "duong"), ("ĐI ĐÂU", "di-dau")],
)
def test_handles_d_stroke_separately(raw_label: str, expected: str) -> None:
    assert stable_sign_id(raw_label) == expected


@pytest.mark.parametrize(
    ("raw_label", "expected"),
    [
        ("  Cái bàn  ", "cai-ban"),
        ("Cái---bàn", "cai-ban"),
        ("(Cái bàn)", "cai-ban"),
        ("Cái  bàn!!", "cai-ban"),
    ],
)
def test_collapses_separators(raw_label: str, expected: str) -> None:
    assert stable_sign_id(raw_label) == expected


def test_mvp30_has_exactly_thirty_unique_labels() -> None:
    """30 nhãn, không trùng, và không nhãn nào chuẩn hoá ra chuỗi rỗng."""
    assert len(MVP30_LABELS) == 30
    stable_ids = [stable_sign_id(label) for label in MVP30_LABELS]
    assert len(set(stable_ids)) == 30
    assert all(stable_ids)
