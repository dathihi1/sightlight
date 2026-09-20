"""Schema đặc trưng `v2_holistic_subset` — 64 khung × 327 chiều.

⚠️ **Hợp đồng dùng chung giữa 3 nơi**: trình duyệt trích (frontend `lib/holistic/featureSchema.ts`),
backend Java kiểm kích thước, và mô hình ONNX ở đây. Lệch bố cục = mô hình nhận rác.

Bố cục 327 chiều (khớp `landmarkSpec` ở api-spec §3.12b):

| Lát cắt      | Khoảng      | Số chiều | Nội dung                                              |
|--------------|-------------|---------:|-------------------------------------------------------|
| `leftHand`   | [0, 63)     |       63 | 21 landmark × (x, y, z) — đã chuẩn hoá theo cổ tay      |
| `rightHand`  | [63, 126)   |       63 | 21 landmark × (x, y, z)                                 |
| `pose`       | [126, 162)  |       36 | 9 landmark × (x, y, z, visibility)                      |
| `face`       | [162, 285)  |      123 | 41 landmark × (x, y, z)                                 |
| `motion`     | [285, 303)  |       18 | 6 điểm neo × (dx, dy, dz) so với khung trước            |
| `geometry`   | [303, 319)  |       16 | Khoảng cách / góc hình học giữa tay – thân – mặt        |
| `quality`    | [319, 327)  |        8 | Cờ hiện diện + chỉ số chất lượng khung                  |
"""

from __future__ import annotations

SCHEMA_VERSION = "v2_holistic_subset"
SEQUENCE_LENGTH = 64
FEATURE_DIM = 327

SLICES: dict[str, tuple[int, int]] = {
    "leftHand": (0, 63),
    "rightHand": (63, 126),
    "pose": (126, 162),
    "face": (162, 285),
    "motion": (285, 303),
    "geometry": (303, 319),
    "quality": (319, 327),
}

# MediaPipe Pose: mũi, hai vai, hai khuỷu, hai cổ tay, hai hông.
POSE_LANDMARK_INDICES: list[int] = [0, 11, 12, 13, 14, 15, 16, 23, 24]

# 41 điểm của Face Mesh: viền mặt, hai mắt, hai chân mày, mũi, miệng.
# Ký hiệu VSL dùng nét mặt làm ngữ pháp nên không thể bỏ hẳn lát `face`.
FACE_LANDMARK_INDICES: list[int] = [
    10, 152, 234, 454, 162, 389,                     # viền mặt (6)
    33, 133, 159, 145, 157, 154,                     # mắt trái (6)
    362, 263, 386, 374, 384, 381,                    # mắt phải (6)
    70, 63, 105, 107,                                # chân mày trái (4)
    300, 293, 334, 336,                              # chân mày phải (4)
    1, 4, 5, 195, 197,                               # sống mũi (5)
    61, 291, 13, 14, 78, 308, 0, 17, 37, 267,        # miệng (10)
]

# Điểm neo tính vận tốc (lát `motion`): cổ tay trái/phải, ngón trỏ trái/phải, mũi, giữa hai vai.
MOTION_ANCHORS: list[str] = [
    "leftWrist", "rightWrist", "leftIndexTip", "rightIndexTip", "nose", "midShoulder",
]

# Giá trị tuyệt đối tối đa chấp nhận cho một phần tử tensor (api-spec §3.12c: |v| <= 50).
MAX_ABS_VALUE = 50.0

assert len(POSE_LANDMARK_INDICES) * 4 == 36
assert len(FACE_LANDMARK_INDICES) * 3 == 123
assert len(MOTION_ANCHORS) * 3 == 18
assert SLICES["quality"][1] == FEATURE_DIM

# Bố cục 8 chiều của lát `quality` — thứ tự cố định, dùng cả ở frontend lẫn ở đây.
QUALITY_FIELDS: list[str] = [
    "leftHandPresent",   # 0/1
    "rightHandPresent",  # 0/1
    "poseDetected",      # 0/1
    "faceDetected",      # 0/1
    "handFrameRatio",    # [0,1] — tỉ lệ khung thấy ít nhất một tay, tính luỹ kế tới khung này
    "bothHandsRatio",    # [0,1] — tỉ lệ khung thấy cả hai tay
    "frameIndexNorm",    # [0,1] — vị trí khung trong chuỗi, giúp mô hình biết nhịp
    "normScale",         # hệ số chuẩn hoá theo khoảng cách hai vai
]

QUALITY_INDEX: dict[str, int] = {
    name: SLICES["quality"][0] + offset for offset, name in enumerate(QUALITY_FIELDS)
}

assert len(QUALITY_FIELDS) == 8
