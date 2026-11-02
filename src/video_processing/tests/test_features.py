from __future__ import annotations

import math

from app.features import FEATURE_DIM, SEQUENCE_LENGTH, LandmarkFrame, Point, build_features


def _points(count: int, frame: int, visibility: float = 1.0) -> list[Point]:
    return [
        Point(
            x=0.2 + index * 0.001 + frame * 0.002,
            y=0.3 + index * 0.0015,
            z=(index % 5) * 0.0005,
            visibility=visibility,
        )
        for index in range(count)
    ]


def test_no_hands_produces_finite_fixed_shape() -> None:
    frames = [LandmarkFrame(left_hand=[], right_hand=[], pose=[], face=[]) for _ in range(12)]
    result = build_features(frames)
    assert len(result.features) == SEQUENCE_LENGTH
    assert all(len(row) == FEATURE_DIM for row in result.features)
    assert all(math.isfinite(value) for row in result.features for value in row)
    assert result.quality["handFrameRatio"] == 0.0
    assert result.quality["bothHandsRatio"] == 0.0


def test_landmark_pipeline_reports_quality_and_clamps_values() -> None:
    frames = [
        LandmarkFrame(
            left_hand=_points(21, frame),
            right_hand=_points(21, frame),
            pose=_points(33, frame),
            face=_points(478, frame),
        )
        for frame in range(20)
    ]
    result = build_features(frames)
    assert result.raw_frame_count == 20
    assert result.frame_count == 20
    assert result.quality == {
        "handFrameRatio": 1.0,
        "bothHandsRatio": 1.0,
        "poseDetected": True,
    }
    assert max(abs(value) for row in result.features for value in row) <= 50.0
