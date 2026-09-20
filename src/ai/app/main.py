"""Dịch vụ AI nhận diện ký hiệu động — SignLight (M10).

Hợp đồng: `docs/sa/api-spec.md` §4. Ràng buộc kiến trúc (HLD ADR-10):

* **Chỉ** phục vụ mạng nội bộ Docker, không mở port ra ngoài, không có xác thực người dùng.
* **Không** chạm CSDL, **không** ghi gì xuống đĩa.
* Endpoint suy luận **duy nhất** là `POST /api/infer/features` (Q8 = phương án B).
  `POST /api/infer/frames`, `POST /api/attempt`, `GET /api/sample/{i}` của repo gốc **không** được bật.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .recognizer import Recognizer
from .schema import FEATURE_DIM, MAX_ABS_VALUE, QUALITY_INDEX, SEQUENCE_LENGTH

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)
log = logging.getLogger("signlight.ai")

MODEL_DIR = Path(os.getenv("MODEL_DIR", "/app/runs/vsl_mvp30_v2_lite_transformer"))

recognizer: Recognizer | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global recognizer
    _assert_disabled_integrations()
    recognizer = Recognizer(MODEL_DIR)
    if recognizer.stub_mode:
        log.warning("Dịch vụ AI khởi động ở CHẾ ĐỘ STUB — kết quả nhận dạng là giả lập")
    yield


app = FastAPI(
    title="SignLight AI Recognition Service",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None,       # không lộ giao diện thử nghiệm (api-spec §4.5)
    redoc_url=None,
    openapi_url=None,
)


def _assert_disabled_integrations() -> None:
    """Ba biến này phải rỗng — chúng là đường ghi dữ liệu người dùng của repo gốc (NFR-12, DR-12)."""
    for name in ("LOG_WEBHOOK_URL", "LOG_WEBHOOK_SECRET", "GDRIVE_FOLDER_ID"):
        if os.getenv(name):
            raise RuntimeError(
                f"{name} phải để rỗng: đường ghi/tải dữ liệu người dùng bị cấm trong sản phẩm"
            )


# --------------------------------------------------------------------- models

# Trường ảnh/video bị cấm tuyệt đối trong payload suy luận (NFR-12, errorCode 10103 phía backend).
FORBIDDEN_MEDIA_KEYS = {
    "frame", "frames", "image", "images", "video", "clip", "photo", "jpeg", "jpg", "png", "base64",
}


class InferFeaturesRequest(BaseModel):
    features: list[list[float]] = Field(..., description=f"Tensor {SEQUENCE_LENGTH}x{FEATURE_DIM}")
    modelVersion: str | None = Field(None, description="Bản mô hình client đang dùng")

    model_config = {"extra": "allow"}  # cho phép nhận rồi TỰ TAY từ chối, xem `_reject_media`


def _reject_media(payload: InferFeaturesRequest) -> str | None:
    extras = payload.model_extra or {}
    for key in extras:
        if key.lower() in FORBIDDEN_MEDIA_KEYS:
            return key
    return None


# ----------------------------------------------------------------- endpoints


@app.get("/health")
def health() -> dict[str, Any]:
    if recognizer is None:
        return JSONResponse(status_code=503, content={"status": "DOWN", "reason": "model_loading"})
    return {
        "status": "UP",
        "modelVersion": recognizer.version_code,
        "numClasses": recognizer.num_classes,
        "stubMode": recognizer.stub_mode,
    }


@app.get("/api/labels")
def labels() -> dict[str, Any]:
    if recognizer is None:
        return JSONResponse(status_code=503, content={"error": "model_loading"})
    return {
        "modelVersion": recognizer.version_code,
        "schemaVersion": recognizer.schema_version,
        "sequenceLength": recognizer.sequence_length,
        "featureDim": recognizer.feature_dim,
        "confidenceThreshold": recognizer.confidence_threshold,
        "confidenceMargin": recognizer.confidence_margin,
        "stubMode": recognizer.stub_mode,
        "labels": recognizer.label_catalog(),
    }


@app.post("/api/infer/features")
def infer_features(payload: InferFeaturesRequest) -> Any:
    """Phân lớp một tensor đặc trưng đã trích sẵn ở trình duyệt (Q8 — phương án B)."""
    if recognizer is None:
        return JSONResponse(status_code=503, content={"error": "model_loading"})

    media_key = _reject_media(payload)
    if media_key is not None:
        log.warning("Từ chối payload chứa trường media: %s", media_key)
        return JSONResponse(status_code=400, content={"error": "media_not_allowed", "field": media_key})

    if payload.modelVersion and payload.modelVersion != recognizer.version_code:
        return JSONResponse(
            status_code=409,
            content={"error": "model_version_mismatch", "active": recognizer.version_code},
        )

    features, problem = _as_tensor(payload.features)
    if problem is not None:
        return JSONResponse(status_code=400, content={"error": problem})

    probabilities, latency_ms = recognizer.infer(features)
    order = np.argsort(probabilities)[::-1][:3]
    top3 = [
        {
            "label": recognizer.labels[int(i)],
            "stableSignId": recognizer.stable_ids[int(i)],
            "confidence": round(float(probabilities[int(i)]), 4),
        }
        for i in order
    ]
    best = top3[0]

    return {
        "status": "ok",
        "label": best["label"],
        "stableSignId": best["stableSignId"],
        "confidence": best["confidence"],
        "top3": top3,
        "quality": _quality_from(features),
        "inferenceLatencyMs": round(latency_ms, 3),
        "retainedMedia": False,   # bất biến: dịch vụ này không giữ lại gì
        "stubMode": recognizer.stub_mode,
    }


# ------------------------------------------------------------------- helpers


def _as_tensor(rows: list[list[float]]) -> tuple[np.ndarray, str | None]:
    """Kiểm kích thước và miền giá trị trước khi đưa vào mô hình."""
    if len(rows) != SEQUENCE_LENGTH:
        return np.empty(0), f"expected_{SEQUENCE_LENGTH}_frames_got_{len(rows)}"
    try:
        tensor = np.asarray(rows, dtype=np.float32)
    except (TypeError, ValueError):
        return np.empty(0), "features_not_numeric"
    if tensor.shape != (SEQUENCE_LENGTH, FEATURE_DIM):
        return np.empty(0), f"expected_shape_{SEQUENCE_LENGTH}x{FEATURE_DIM}_got_{list(tensor.shape)}"
    if not np.all(np.isfinite(tensor)):
        return np.empty(0), "features_not_finite"
    if float(np.max(np.abs(tensor))) > MAX_ABS_VALUE:
        return np.empty(0), "features_out_of_range"
    return tensor, None


def _quality_from(features: np.ndarray) -> dict[str, Any]:
    """Đọc lại chỉ số chất lượng từ lát `quality` — dùng để đối chiếu với `clientQuality`."""
    last_frame = features[-1]
    hand_ratio = float(np.clip(last_frame[QUALITY_INDEX["handFrameRatio"]], 0.0, 1.0))
    both_ratio = float(np.clip(last_frame[QUALITY_INDEX["bothHandsRatio"]], 0.0, 1.0))
    pose_column = features[:, QUALITY_INDEX["poseDetected"]]
    return {
        "handFrameRatio": round(hand_ratio, 4),
        "bothHandsRatio": round(both_ratio, 4),
        "poseDetected": bool(float(np.mean(pose_column)) >= 0.5),
    }
