from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from .config import Settings
from .errors import InvalidVideoError
from .schemas import VideoMetadata

MP4_MAGIC = b"ftyp"
WEBM_MAGIC = b"\x1aE\xdf\xa3"
ALLOWED_CONTENT_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_CODECS = {"avc1", "h264", "hevc", "hvc1", "mp4v", "fmp4", "vp80", "vp90", "av01"}


@dataclass(slots=True)
class DecodedVideo:
    frames_rgb: list[np.ndarray]
    timestamps_ms: list[int]
    metadata: VideoMetadata


def detect_container(data: bytes) -> tuple[str, str]:
    if len(data) >= 12 and data[4:8] == MP4_MAGIC:
        brand = data[8:12]
        return ("quicktime" if brand == b"qt  " else "mp4", ".mov" if brand == b"qt  " else ".mp4")
    if data.startswith(WEBM_MAGIC):
        return "webm", ".webm"
    raise InvalidVideoError("unsupported_format", "Chỉ hỗ trợ video MP4, MOV hoặc WebM hợp lệ.")


def rotate_frame(frame: np.ndarray, degrees: int) -> np.ndarray:
    normalized = degrees % 360
    if normalized == 90:
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    if normalized == 180:
        return cv2.rotate(frame, cv2.ROTATE_180)
    if normalized == 270:
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return frame


class OpenCvVideoDecoder:
    def __init__(self, settings: Settings, temp_directory: Path | None = None) -> None:
        self._settings = settings
        self._temp_directory = temp_directory

    def decode(self, data: bytes, content_type: str) -> DecodedVideo:
        if content_type.lower().split(";", 1)[0] not in ALLOWED_CONTENT_TYPES:
            raise InvalidVideoError("unsupported_content_type", "Content-Type video không được hỗ trợ.", 415)
        container_name, suffix = detect_container(data)
        temp_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(
                suffix=suffix,
                dir=self._temp_directory,
                delete=False,
            ) as handle:
                temp_path = handle.name
                handle.write(data)
            return self._decode_path(temp_path, container_name)
        finally:
            if temp_path:
                try:
                    os.unlink(temp_path)
                except FileNotFoundError:
                    pass

    def _decode_path(self, path: str, container_name: str) -> DecodedVideo:
        capture = cv2.VideoCapture(path)
        if not capture.isOpened():
            capture.release()
            raise InvalidVideoError("unreadable_video", "Không thể giải mã video đã tải lên.")
        try:
            fps = float(capture.get(cv2.CAP_PROP_FPS))
            if not np.isfinite(fps) or fps <= 0:
                fps = self._settings.target_sample_fps
            frame_total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            orientation = int(capture.get(cv2.CAP_PROP_ORIENTATION_META)) if hasattr(cv2, "CAP_PROP_ORIENTATION_META") else 0
            if hasattr(cv2, "CAP_PROP_ORIENTATION_AUTO"):
                capture.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
                orientation = 0

            codec = self._codec_name(int(capture.get(cv2.CAP_PROP_FOURCC)))
            if codec and codec not in ALLOWED_CODECS:
                raise InvalidVideoError("unsupported_codec", f"Codec video không được hỗ trợ: {codec}", 415)

            duration_ms = int(round(frame_total / fps * 1000)) if frame_total > 0 else 0
            if duration_ms > self._settings.max_duration_ms:
                raise InvalidVideoError("video_too_long", "Video vượt quá thời lượng cho phép.", 413)
            if width > self._settings.max_width or height > self._settings.max_height:
                raise InvalidVideoError("resolution_too_large", "Độ phân giải video vượt quá giới hạn.", 413)

            frames: list[np.ndarray] = []
            timestamps: list[int] = []
            decoded_count = 0
            next_sample_ms = 0.0
            sample_interval_ms = 1000.0 / self._settings.target_sample_fps
            last_timestamp = -1

            while True:
                ok, frame = capture.read()
                if not ok:
                    break
                decoded_count += 1
                timestamp = float(capture.get(cv2.CAP_PROP_POS_MSEC))
                if not np.isfinite(timestamp) or timestamp <= 0:
                    timestamp = (decoded_count - 1) * 1000.0 / fps
                if timestamp > self._settings.max_duration_ms + 100:
                    raise InvalidVideoError("video_too_long", "Video vượt quá thời lượng cho phép.", 413)
                if timestamp + 0.5 < next_sample_ms:
                    continue
                frame = rotate_frame(frame, orientation)
                frame_height, frame_width = frame.shape[:2]
                if frame_width > self._settings.max_width or frame_height > self._settings.max_height:
                    raise InvalidVideoError("resolution_too_large", "Độ phân giải video vượt quá giới hạn.", 413)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                monotonic_timestamp = max(last_timestamp + 1, int(round(timestamp)))
                frames.append(rgb)
                timestamps.append(monotonic_timestamp)
                last_timestamp = monotonic_timestamp
                next_sample_ms += sample_interval_ms
                if len(frames) >= self._settings.max_sampled_frames:
                    break

            if not frames:
                raise InvalidVideoError("empty_video", "Video không chứa khung hình đọc được.")
            effective_duration = duration_ms or max(timestamps[-1] + int(sample_interval_ms), 1)
            if effective_duration < self._settings.min_duration_ms:
                raise InvalidVideoError("video_too_short", "Video quá ngắn để nhận diện ký hiệu.")
            return DecodedVideo(
                frames_rgb=frames,
                timestamps_ms=timestamps,
                metadata=VideoMetadata(
                    container=container_name,
                    codec=codec or "unknown",
                    width=frames[0].shape[1],
                    height=frames[0].shape[0],
                    sourceFps=round(fps, 3),
                    durationMs=effective_duration,
                    decodedFrames=decoded_count,
                    sampledFrames=len(frames),
                ),
            )
        finally:
            capture.release()

    @staticmethod
    def _codec_name(value: int) -> str:
        if value <= 0:
            return ""
        return "".join(chr((value >> (8 * index)) & 0xFF) for index in range(4)).lower().strip("\x00 ")
