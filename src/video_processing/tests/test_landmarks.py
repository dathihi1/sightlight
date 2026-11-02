from __future__ import annotations

from app.landmarks import strictly_increasing_timestamps


def test_timestamps_are_strictly_increasing_with_duplicates_and_regressions() -> None:
    result = strictly_increasing_timestamps([0, 0, 33, 20, 66])

    assert result == [0, 1, 33, 34, 66]
    assert all(right > left for left, right in zip(result, result[1:], strict=False))


def test_each_new_clip_can_restart_at_zero() -> None:
    first = strictly_increasing_timestamps([0, 33, 66])
    second = strictly_increasing_timestamps([0, 33, 66])

    assert first == [0, 33, 66]
    assert second == [0, 33, 66]
