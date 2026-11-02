from __future__ import annotations

import time
from dataclasses import dataclass

from .features import FeatureResult, build_features
from .landmarks import MediaPipeHolisticExtractor
from .schemas import VideoMetadata
from .video import OpenCvVideoDecoder


@dataclass(slots=True)
class ProcessingResult:
    features: FeatureResult
    video: VideoMetadata
    decoding_ms: float
    landmark_ms: float
    preprocessing_ms: float


class VideoProcessor:
    def __init__(self, decoder: OpenCvVideoDecoder, extractor: MediaPipeHolisticExtractor) -> None:
        self._decoder = decoder
        self._extractor = extractor

    def process(self, data: bytes, content_type: str) -> ProcessingResult:
        started = time.perf_counter()
        decoded = self._decoder.decode(data, content_type)
        decoded_at = time.perf_counter()
        landmark_frames = self._extractor.extract(decoded.frames_rgb, decoded.timestamps_ms)
        landmarked_at = time.perf_counter()
        features = build_features(landmark_frames)
        finished = time.perf_counter()
        return ProcessingResult(
            features=features,
            video=decoded.metadata,
            decoding_ms=(decoded_at - started) * 1000,
            landmark_ms=(landmarked_at - decoded_at) * 1000,
            preprocessing_ms=(finished - landmarked_at) * 1000,
        )

    def close(self) -> None:
        self._extractor.close()
