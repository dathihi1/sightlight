from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

SCHEMA_VERSION = "v2_holistic_subset"
SEQUENCE_LENGTH = 64
FEATURE_DIM = 327
MIN_USEFUL_FRAMES = 8
MAX_USEFUL_FRAMES = 32
MAX_ABS_VALUE = 50.0

POSE_LANDMARK_INDICES = (0, 11, 12, 13, 14, 15, 16, 23, 24)
FACE_LANDMARK_INDICES = (
    10, 33, 61, 78, 81, 82, 87, 88, 91, 95, 133, 146, 159, 160, 161, 173,
    178, 181, 185, 191, 199, 263, 291, 308, 311, 312, 317, 318, 321, 324,
    362, 374, 386, 387, 388, 398, 402, 405, 409, 415, 454,
)


@dataclass(slots=True)
class Point:
    x: float
    y: float
    z: float
    visibility: float = 1.0


@dataclass(slots=True)
class LandmarkFrame:
    left_hand: list[Point]
    right_hand: list[Point]
    pose: list[Point]
    face: list[Point]


@dataclass(slots=True)
class FeatureResult:
    features: list[list[float]]
    raw_frame_count: int
    frame_count: int
    quality: dict[str, float | bool]


@dataclass(slots=True)
class _RawFrame:
    left_hand: list[float]
    right_hand: list[float]
    pose: list[float]
    face: list[float]
    quality: list[float]


def build_features(frames: list[LandmarkFrame]) -> FeatureResult:
    raw = [_flatten_landmark_frame(frame) for frame in frames[:SEQUENCE_LENGTH]]
    if not raw:
        return FeatureResult(
            features=[[0.0] * FEATURE_DIM for _ in range(SEQUENCE_LENGTH)],
            raw_frame_count=0,
            frame_count=0,
            quality={"handFrameRatio": 0.0, "bothHandsRatio": 0.0, "poseDetected": False},
        )

    valid_count = sum(frame.quality[4] > 0.5 for frame in raw)
    base = [frame.left_hand + frame.right_hand + frame.pose + frame.face for frame in raw]
    quality = [frame.quality.copy() for frame in raw]
    for row in quality:
        row[6] = 1.0 - row[4]
        row[7] = 1.0 - row[3]

    _normalize_coordinates(base, quality)
    _interpolate_short_gaps(base, quality)
    base, quality = _trim_still_frames(base, quality)
    base = _resample(base, SEQUENCE_LENGTH)
    quality = _resample(quality, SEQUENCE_LENGTH)

    for row in quality:
        for index in range(6):
            row[index] = 1.0 if row[index] >= 0.5 else 0.0
        row[6] = _clamp(row[6], 0.0, 1.0)
        row[7] = _clamp(row[7], 0.0, 1.0)

    engineered = _derive_engineered_features(base, quality)
    features = [
        [_clamp_feature(value) for value in base[index] + engineered[index] + quality[index]]
        for index in range(SEQUENCE_LENGTH)
    ]
    if any(len(row) != FEATURE_DIM for row in features):
        raise RuntimeError(f"Feature pipeline mismatch: expected {FEATURE_DIM} dimensions")

    def average(index: int) -> float:
        return sum(row[index] for row in quality) / SEQUENCE_LENGTH

    effective_count = max(
        MIN_USEFUL_FRAMES,
        min(MAX_USEFUL_FRAMES, valid_count or min(len(raw), MAX_USEFUL_FRAMES)),
    )
    return FeatureResult(
        features=features,
        raw_frame_count=len(raw),
        frame_count=effective_count,
        quality={
            "handFrameRatio": round(average(4), 4),
            "bothHandsRatio": round(average(5), 4),
            "poseDetected": average(2) >= 0.5,
        },
    )


def _flatten_landmark_frame(frame: LandmarkFrame) -> _RawFrame:
    has_left = len(frame.left_hand) >= 21
    has_right = len(frame.right_hand) >= 21
    has_pose = len(frame.pose) >= 25
    has_face = len(frame.face) >= 455
    has_hand = has_left or has_right

    left = [0.0] * 63
    if has_left:
        for index, point in enumerate(frame.left_hand[:21]):
            left[index * 3 : index * 3 + 3] = [point.x, point.y, point.z]

    right = [0.0] * 63
    if has_right:
        for index, point in enumerate(frame.right_hand[:21]):
            right[index * 3 : index * 3 + 3] = [point.x, point.y, point.z]

    pose = [0.0] * 36
    if has_pose:
        for output_index, source_index in enumerate(POSE_LANDMARK_INDICES):
            point = frame.pose[source_index]
            offset = output_index * 4
            pose[offset : offset + 4] = [point.x, point.y, point.z, point.visibility]

    face = [0.0] * 123
    if has_face:
        for output_index, source_index in enumerate(FACE_LANDMARK_INDICES):
            point = frame.face[source_index]
            offset = output_index * 3
            face[offset : offset + 3] = [point.x, point.y, point.z]

    return _RawFrame(
        left_hand=left,
        right_hand=right,
        pose=pose,
        face=face,
        quality=[
            float(has_left),
            float(has_right),
            float(has_pose),
            float(has_face),
            float(has_hand),
            float(has_left and has_right),
            float(not has_hand),
            float(not has_face),
        ],
    )


def _normalize_coordinates(base: list[list[float]], quality: list[list[float]]) -> None:
    for frame, flags in zip(base, quality, strict=True):
        center_x: float | None = None
        center_y: float | None = None
        scale = 1.0
        if flags[2] > 0.5 and frame[133] > 0.2 and frame[137] > 0.2:
            left_x, left_y = frame[130], frame[131]
            right_x, right_y = frame[134], frame[135]
            center_x = (left_x + right_x) / 2.0
            center_y = (left_y + right_y) / 2.0
            scale = math.hypot(left_x - right_x, left_y - right_y)
        else:
            xs: list[float] = []
            ys: list[float] = []
            if flags[0] > 0.5:
                _collect_xy(frame, 0, 21, 3, xs, ys)
            if flags[1] > 0.5:
                _collect_xy(frame, 63, 21, 3, xs, ys)
            if flags[3] > 0.5:
                _collect_xy(frame, 162, 41, 3, xs, ys)
            if xs:
                center_x = sum(xs) / len(xs)
                center_y = sum(ys) / len(ys)
                scale = math.hypot(max(xs) - min(xs), max(ys) - min(ys))

        if center_x is None or center_y is None:
            continue
        scale = max(scale, 0.001)
        if flags[0] > 0.5:
            _normalize_triples(frame, 0, 21, center_x, center_y, scale)
        if flags[1] > 0.5:
            _normalize_triples(frame, 63, 21, center_x, center_y, scale)
        if flags[2] > 0.5:
            for index in range(9):
                offset = 126 + 4 * index
                if frame[offset + 3] <= 0.2:
                    continue
                frame[offset] = (frame[offset] - center_x) / scale
                frame[offset + 1] = (frame[offset + 1] - center_y) / scale
                frame[offset + 2] /= scale
        if flags[3] > 0.5:
            _normalize_triples(frame, 162, 41, center_x, center_y, scale)


def _interpolate_short_gaps(base: list[list[float]], quality: list[list[float]]) -> None:
    groups = ((0, 63, 0), (63, 126, 1), (126, 162, 2), (162, 285, 3))
    for start, end, flag in groups:
        present = [index for index, row in enumerate(quality) if row[flag] > 0.5]
        for left, right in zip(present, present[1:], strict=False):
            gap = right - left - 1
            if gap <= 0 or gap > 5:
                continue
            for step in range(1, gap + 1):
                ratio = step / (gap + 1)
                for dimension in range(start, end):
                    base[left + step][dimension] = (
                        (1.0 - ratio) * base[left][dimension] + ratio * base[right][dimension]
                    )


def _trim_still_frames(
    base: list[list[float]], quality: list[list[float]]
) -> tuple[list[list[float]], list[list[float]]]:
    if len(base) <= 4:
        return base, quality
    motion = _motion_energy(base, quality)
    if max(motion) < 0.015:
        return base, quality
    active = [index for index, value in enumerate(motion) if value >= 0.015]
    if not active:
        return base, quality
    start = max(0, active[0] - 4)
    end = min(len(base), active[-1] + 5)
    if end - start < 8:
        return base, quality
    return base[start:end], quality[start:end]


def _motion_energy(base: list[list[float]], quality: list[list[float]]) -> list[float]:
    result = [0.0] * len(base)
    left_centers = _hand_centers(base, quality, 0, 0)
    right_centers = _hand_centers(base, quality, 1, 63)
    for index in range(1, len(base)):
        energy = 0.0
        if quality[index][0] > 0.5 and quality[index - 1][0] > 0.5:
            energy += _distance(left_centers[index], left_centers[index - 1])
        if quality[index][1] > 0.5 and quality[index - 1][1] > 0.5:
            energy += _distance(right_centers[index], right_centers[index - 1])
        result[index] = energy / 2.0
    return result


def _derive_engineered_features(
    base: list[list[float]], quality: list[list[float]]
) -> list[list[float]]:
    relational = _derive_relational_features(base, quality)
    temporal = _derive_temporal_features(base, quality, relational)
    return [temporal[index] + relational[index] for index in range(len(base))]


def _derive_relational_features(
    base: list[list[float]], quality: list[list[float]]
) -> list[list[float]]:
    mouth_indices = [FACE_LANDMARK_INDICES.index(value) for value in (61, 291, 78, 308)]
    chin_indices = [FACE_LANDMARK_INDICES.index(value) for value in (199,)]
    output_rows: list[list[float]] = []
    for frame, flags in zip(base, quality, strict=True):
        output = [0.0] * 16
        left_center = _center(frame, 0, 21) if flags[0] > 0.5 else [0.0, 0.0]
        right_center = _center(frame, 63, 21) if flags[1] > 0.5 else [0.0, 0.0]
        nose = [frame[126], frame[127]] if flags[2] > 0.5 and frame[129] > 0.2 else [0.0, 0.0]
        shoulders_visible = flags[2] > 0.5 and frame[133] > 0.2 and frame[137] > 0.2
        shoulder_center = (
            [(frame[130] + frame[134]) / 2.0, (frame[131] + frame[135]) / 2.0]
            if shoulders_visible
            else [0.0, 0.0]
        )
        mouth = _selected_face_center(frame, mouth_indices) if flags[3] > 0.5 else [0.0, 0.0]
        chin = _selected_face_center(frame, chin_indices) if flags[3] > 0.5 else [0.0, 0.0]
        output[0] = _optional_distance(left_center, right_center)
        output[1] = _optional_distance(left_center, shoulder_center)
        output[2] = _optional_distance(right_center, shoulder_center)
        output[3] = _optional_distance(left_center, mouth)
        output[4] = _optional_distance(right_center, mouth)
        output[5] = _optional_distance(left_center, chin)
        output[6] = _optional_distance(right_center, chin)
        output[7] = _optional_distance(left_center, nose)
        output[8] = _optional_distance(right_center, nose)
        output[9] = _optional_distance(left_center, [frame[130], frame[131]])
        output[10] = _optional_distance(right_center, [frame[134], frame[135]])
        output[11] = _hand_span(frame, 0, flags[0] > 0.5)
        output[12] = _hand_span(frame, 63, flags[1] > 0.5)
        output[13] = _hand_angle(frame, 0, flags[0] > 0.5)
        output[14] = _hand_angle(frame, 63, flags[1] > 0.5)
        output[15] = (
            math.atan2(frame[135] - frame[131], frame[134] - frame[130]) / math.pi
            if shoulders_visible
            else 0.0
        )
        output_rows.append(output)
    return output_rows


def _derive_temporal_features(
    base: list[list[float]], quality: list[list[float]], relational: list[list[float]]
) -> list[list[float]]:
    output = [[0.0] * 18 for _ in base]
    left_centers = _hand_centers(base, quality, 0, 0)
    right_centers = _hand_centers(base, quality, 1, 63)
    left_wrists = [[frame[0], frame[1]] if quality[i][0] > 0.5 else [0.0, 0.0] for i, frame in enumerate(base)]
    right_wrists = [[frame[63], frame[64]] if quality[i][1] > 0.5 else [0.0, 0.0] for i, frame in enumerate(base)]
    for index in range(1, len(base)):
        left_dx = left_centers[index][0] - left_centers[index - 1][0]
        left_dy = left_centers[index][1] - left_centers[index - 1][1]
        right_dx = right_centers[index][0] - right_centers[index - 1][0]
        right_dy = right_centers[index][1] - right_centers[index - 1][1]
        left_wrist_dx = left_wrists[index][0] - left_wrists[index - 1][0]
        left_wrist_dy = left_wrists[index][1] - left_wrists[index - 1][1]
        right_wrist_dx = right_wrists[index][0] - right_wrists[index - 1][0]
        right_wrist_dy = right_wrists[index][1] - right_wrists[index - 1][1]
        row = output[index]
        row[0:12] = [
            left_dx, left_dy, math.hypot(left_dx, left_dy),
            right_dx, right_dy, math.hypot(right_dx, right_dy),
            left_wrist_dx, left_wrist_dy, math.hypot(left_wrist_dx, left_wrist_dy),
            right_wrist_dx, right_wrist_dy, math.hypot(right_wrist_dx, right_wrist_dy),
        ]
        for relation_index in range(5):
            row[12 + relation_index] = relational[index][relation_index] - relational[index - 1][relation_index]
        row[17] = (row[2] + row[5]) / 2.0
    return output


def _resample(rows: list[list[float]], target_length: int) -> list[list[float]]:
    if len(rows) == target_length:
        return [row.copy() for row in rows]
    if len(rows) == 1:
        return [rows[0].copy() for _ in range(target_length)]
    output: list[list[float]] = []
    for target in range(target_length):
        position = target * (len(rows) - 1) / (target_length - 1)
        left = math.floor(position)
        right = min(left + 1, len(rows) - 1)
        ratio = position - left
        output.append([
            value * (1.0 - ratio) + rows[right][index] * ratio
            for index, value in enumerate(rows[left])
        ])
    return output


def _hand_centers(base: list[list[float]], quality: list[list[float]], quality_index: int, start: int) -> list[list[float]]:
    return [
        _center(frame, start, 21) if quality[index][quality_index] > 0.5 else [0.0, 0.0]
        for index, frame in enumerate(base)
    ]


def _center(frame: list[float], start: int, count: int) -> list[float]:
    return [
        sum(frame[start + 3 * index] for index in range(count)) / count,
        sum(frame[start + 3 * index + 1] for index in range(count)) / count,
    ]


def _selected_face_center(frame: list[float], indices: list[int]) -> list[float]:
    if not indices:
        return [0.0, 0.0]
    return [
        sum(frame[162 + 3 * index] for index in indices) / len(indices),
        sum(frame[162 + 3 * index + 1] for index in indices) / len(indices),
    ]


def _hand_span(frame: list[float], start: int, present: bool) -> float:
    if not present:
        return 0.0
    tips = (4, 8, 12, 16, 20)
    xs = [frame[start + 3 * index] for index in tips]
    ys = [frame[start + 3 * index + 1] for index in tips]
    return math.hypot(max(xs) - min(xs), max(ys) - min(ys))


def _hand_angle(frame: list[float], start: int, present: bool) -> float:
    if not present:
        return 0.0
    return math.atan2(frame[start + 28] - frame[start + 1], frame[start + 27] - frame[start]) / math.pi


def _collect_xy(frame: list[float], start: int, count: int, stride: int, xs: list[float], ys: list[float]) -> None:
    for index in range(count):
        xs.append(frame[start + stride * index])
        ys.append(frame[start + stride * index + 1])


def _normalize_triples(frame: list[float], start: int, count: int, center_x: float, center_y: float, scale: float) -> None:
    for index in range(count):
        offset = start + 3 * index
        frame[offset] = (frame[offset] - center_x) / scale
        frame[offset + 1] = (frame[offset + 1] - center_y) / scale
        frame[offset + 2] /= scale


def _distance(left: list[float], right: list[float]) -> float:
    return math.hypot(left[0] - right[0], left[1] - right[1])


def _optional_distance(left: list[float], right: list[float]) -> float:
    left_present = left[0] != 0 or left[1] != 0
    right_present = right[0] != 0 or right[1] != 0
    return _distance(left, right) if left_present and right_present else 0.0


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _clamp_feature(value: float) -> float:
    if not np.isfinite(value):
        return 0.0
    return _clamp(float(f"{value:.5f}"), -MAX_ABS_VALUE, MAX_ABS_VALUE)
