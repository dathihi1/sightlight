from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ProcessingTimings(BaseModel):
    uploadMs: float = 0
    authorizationMs: float = 0
    videoDecodingMs: float = 0
    landmarkExtractionMs: float = 0
    tensorPreprocessingMs: float = 0
    backendAndAiMs: float = 0
    totalMs: float = 0


class VideoMetadata(BaseModel):
    container: str
    codec: str
    width: int
    height: int
    sourceFps: float
    durationMs: int
    decodedFrames: int
    sampledFrames: int


class ExtractionQuality(BaseModel):
    rawLandmarkFrames: int
    effectiveFrames: int
    handFrameRatio: float
    bothHandsRatio: float
    poseDetected: bool


class VideoInferenceResponse(BaseModel):
    requestId: str
    status: str
    predictedLabel: str | None = None
    confidence: float | None = None
    topK: list[dict[str, Any]] = Field(default_factory=list)
    modelVersion: str
    verified: bool
    qualityHints: list[str] = Field(default_factory=list)
    processingTimeMs: float
    timings: ProcessingTimings
    video: VideoMetadata
    extraction: ExtractionQuality
    retainedMedia: bool = False
    attempt: dict[str, Any]


class ErrorResponse(BaseModel):
    requestId: str
    status: str = "error"
    errorCode: str
    message: str
    retryable: bool = False
