from __future__ import annotations

from pathlib import Path
from threading import Lock

import mediapipe as mp
import numpy as np

from .features import LandmarkFrame, Point


class MediaPipeHolisticExtractor:
    def __init__(self, model_path: Path) -> None:
        if not model_path.is_file():
            raise RuntimeError(
                f"Holistic model not found: {model_path}. Run scripts/download_holistic_model.py first."
            )
        self._model_path = model_path
        # Native MediaPipe tasks are CPU-heavy. Serializing extraction also keeps
        # peak memory predictable when multiple uploads arrive together.
        self._lock = Lock()

    def extract(self, frames_rgb: list[np.ndarray], timestamps_ms: list[int]) -> list[LandmarkFrame]:
        output: list[LandmarkFrame] = []
        with self._lock:
            # VIDEO mode stores timestamp state inside the native landmarker.
            # A fresh task per clip guarantees that a mobile video beginning at
            # timestamp 0 cannot collide with a previous request or replica task.
            landmarker = self._create_landmarker()
            try:
                normalized_timestamps = strictly_increasing_timestamps(timestamps_ms)
                for frame, timestamp in zip(frames_rgb, normalized_timestamps, strict=True):
                    image = mp.Image(
                        image_format=mp.ImageFormat.SRGB,
                        data=np.ascontiguousarray(frame),
                    )
                    result = landmarker.detect_for_video(image, timestamp)
                    output.append(
                        LandmarkFrame(
                            left_hand=self._points(result.left_hand_landmarks),
                            right_hand=self._points(result.right_hand_landmarks),
                            pose=self._points(result.pose_landmarks),
                            face=self._points(result.face_landmarks),
                        )
                    )
            finally:
                landmarker.close()
        return output

    def close(self) -> None:
        # Landmarkers are scoped and closed per uploaded clip.
        return None

    def _create_landmarker(self):
        options = mp.tasks.vision.HolisticLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(self._model_path)),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
        )
        return mp.tasks.vision.HolisticLandmarker.create_from_options(options)

    @staticmethod
    def _points(landmarks: list[object] | None) -> list[Point]:
        return [
            Point(
                x=float(getattr(point, "x", 0.0)),
                y=float(getattr(point, "y", 0.0)),
                z=float(getattr(point, "z", 0.0)),
                visibility=float(getattr(point, "visibility", 1.0) or 0.0),
            )
            for point in (landmarks or [])
        ]


def strictly_increasing_timestamps(
    timestamps_ms: list[int],
    *,
    minimum_exclusive: int = -1,
) -> list[int]:
    """Normalize clip timestamps for MediaPipe VIDEO mode.

    OpenCV/mobile containers can emit duplicate or backward timestamps, and a
    Every value sent to MediaPipe must be greater than its predecessor inside
    the current clip.
    """
    output: list[int] = []
    previous = minimum_exclusive
    for value in timestamps_ms:
        current = max(previous + 1, int(value))
        output.append(current)
        previous = current
    return output
