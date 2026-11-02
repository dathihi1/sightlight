from __future__ import annotations

from dataclasses import replace
from pathlib import Path

import cv2
import numpy as np
import pytest

from app.errors import InvalidVideoError
from app.video import OpenCvVideoDecoder, detect_container, rotate_frame


def test_detects_mp4_webm_and_rejects_random_bytes() -> None:
    assert detect_container(b"\x00\x00\x00\x18ftypisommore")[0] == "mp4"
    assert detect_container(b"\x1aE\xdf\xa3more")[0] == "webm"
    with pytest.raises(InvalidVideoError):
        detect_container(b"not-a-video")


def test_orientation_rotation() -> None:
    frame = np.arange(2 * 3 * 3, dtype=np.uint8).reshape((2, 3, 3))
    assert rotate_frame(frame, 90).shape[:2] == (3, 2)
    assert rotate_frame(frame, 180).shape[:2] == (2, 3)
    assert rotate_frame(frame, 270).shape[:2] == (3, 2)


def test_temporary_file_is_removed_when_decode_fails(settings, tmp_path: Path, monkeypatch) -> None:
    decoder = OpenCvVideoDecoder(settings, temp_directory=tmp_path)

    def fail(path: str, container: str):
        assert Path(path).exists()
        raise InvalidVideoError("unreadable_video", "bad")

    monkeypatch.setattr(decoder, "_decode_path", fail)
    with pytest.raises(InvalidVideoError):
        decoder.decode(b"\x00\x00\x00\x18ftypisommore", "video/mp4")
    assert list(tmp_path.iterdir()) == []


def _write_mp4(path: Path, *, fps: float, frame_count: int) -> bytes:
    writer = cv2.VideoWriter(
        str(path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (320, 240),
    )
    if not writer.isOpened():
        pytest.skip("OpenCV build cannot encode an MP4 test fixture")
    for index in range(frame_count):
        writer.write(np.full((240, 320, 3), index % 255, dtype=np.uint8))
    writer.release()
    return path.read_bytes()


def test_decoder_samples_source_fps_to_target_fps(settings, tmp_path: Path) -> None:
    data = _write_mp4(tmp_path / "source.mp4", fps=30, frame_count=30)
    decoded = OpenCvVideoDecoder(settings, temp_directory=tmp_path).decode(data, "video/mp4")
    assert decoded.metadata.sourceFps == pytest.approx(30, abs=0.5)
    assert decoded.metadata.durationMs == pytest.approx(1_000, abs=100)
    assert 15 <= decoded.metadata.sampledFrames <= 17
    assert all(
        right > left
        for left, right in zip(
            decoded.timestamps_ms,
            decoded.timestamps_ms[1:],
            strict=False,
        )
    )


def test_decoder_rejects_short_and_over_duration_videos(settings, tmp_path: Path) -> None:
    short = _write_mp4(tmp_path / "short.mp4", fps=30, frame_count=3)
    with pytest.raises(InvalidVideoError) as short_error:
        OpenCvVideoDecoder(settings, temp_directory=tmp_path).decode(short, "video/mp4")
    assert short_error.value.code == "video_too_short"

    normal = _write_mp4(tmp_path / "normal.mp4", fps=30, frame_count=30)
    strict = replace(settings, max_duration_ms=500)
    with pytest.raises(InvalidVideoError) as long_error:
        OpenCvVideoDecoder(strict, temp_directory=tmp_path).decode(normal, "video/mp4")
    assert long_error.value.code == "video_too_long"
