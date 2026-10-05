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
from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .recognizer import Recognizer
from .schema import FEATURE_DIM, MAX_ABS_VALUE, QUALITY_INDEX, SEQUENCE_LENGTH

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)
log = logging.getLogger("signlight.ai")

MODEL_NAMES = (
    "vsl_mvp30_v2_lite_transformer",
    "vsl_mvp400_v2_lite_transformer",
)
DEFAULT_MODEL_VERSION = os.getenv(
    "DEFAULT_MODEL_VERSION", "vsl-mvp400-v2-lite-transformer"
)
env_dir = Path(os.getenv("MODEL_DIR", "")) if os.getenv("MODEL_DIR") else None
runs_dir = env_dir.parent if env_dir and env_dir.exists() else Path(__file__).resolve().parent.parent / "runs"
MODEL_DIRS = [runs_dir / name for name in MODEL_NAMES if (runs_dir / name).exists()]

recognizers: dict[str, Recognizer] = {}
SERVICE_TOKEN = os.getenv("SIGNLIGHT_AI_SERVICE_TOKEN", "")
REQUIRE_SERVICE_TOKEN = os.getenv("SIGNLIGHT_AI_REQUIRE_TOKEN", "false").lower() == "true"


def _authorize(authorization: str | None) -> JSONResponse | None:
    if not SERVICE_TOKEN:
        if REQUIRE_SERVICE_TOKEN:
            return JSONResponse(status_code=503, content={"error": "service_not_configured"})
        return None
    expected = f"Bearer {SERVICE_TOKEN}"
    if authorization != expected:
        return JSONResponse(status_code=401, content={"error": "unauthorized"})
    return None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global recognizers
    _assert_disabled_integrations()
    if REQUIRE_SERVICE_TOKEN and not SERVICE_TOKEN:
        raise RuntimeError("SIGNLIGHT_AI_SERVICE_TOKEN is required when SIGNLIGHT_AI_REQUIRE_TOKEN=true")
    recognizers = {}
    for model_dir in MODEL_DIRS:
        loaded = Recognizer(model_dir)
        recognizers[loaded.version_code] = loaded
        if loaded.stub_mode:
            log.warning(
                "Mô hình %s khởi động ở CHẾ ĐỘ STUB — kết quả nhận dạng là giả lập",
                loaded.version_code,
            )
    if not recognizers:
        raise RuntimeError(f"Không tìm thấy model trong {runs_dir}")
    log.info("Đã nạp %d mô hình: %s", len(recognizers), ", ".join(recognizers))
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
    if not recognizers:
        return JSONResponse(status_code=503, content={"status": "DOWN", "reason": "model_loading"})
    default = recognizers.get(DEFAULT_MODEL_VERSION) or next(iter(recognizers.values()))
    return {
        "status": "UP",
        "modelVersion": default.version_code,
        "numClasses": default.num_classes,
        "stubMode": default.stub_mode,
        "models": [
            {
                "modelVersion": model.version_code,
                "numClasses": model.num_classes,
                "stubMode": model.stub_mode,
            }
            for model in recognizers.values()
        ],
    }


@app.get("/api/labels", response_model=None)
def labels(
    modelVersion: str | None = None,
    authorization: str | None = Header(default=None),
) -> dict[str, Any] | JSONResponse:
    unauthorized = _authorize(authorization)
    if unauthorized is not None:
        return unauthorized
    if not recognizers:
        return JSONResponse(status_code=503, content={"error": "model_loading"})
    recognizer = recognizers.get(modelVersion or DEFAULT_MODEL_VERSION)
    if recognizer is None:
        return JSONResponse(
            status_code=404,
            content={"error": "model_not_found", "available": list(recognizers)},
        )
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
def infer_features(
    payload: InferFeaturesRequest,
    authorization: str | None = Header(default=None),
) -> Any:
    """Phân lớp một tensor đặc trưng đã trích sẵn ở trình duyệt (Q8 — phương án B)."""
    unauthorized = _authorize(authorization)
    if unauthorized is not None:
        return unauthorized
    if not recognizers:
        return JSONResponse(status_code=503, content={"error": "model_loading"})

    media_key = _reject_media(payload)
    if media_key is not None:
        log.warning("Từ chối payload chứa trường media: %s", media_key)
        return JSONResponse(status_code=400, content={"error": "media_not_allowed", "field": media_key})

    recognizer = recognizers.get(payload.modelVersion or DEFAULT_MODEL_VERSION)
    if recognizer is None:
        return JSONResponse(
            status_code=409,
            content={"error": "model_version_mismatch", "available": list(recognizers)},
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
    any_hand_col = features[:, QUALITY_INDEX["any_hand_detected"]]
    both_hands_col = features[:, QUALITY_INDEX["both_hands_detected"]]
    pose_column = features[:, QUALITY_INDEX["pose_detected"]]
    return {
        "handFrameRatio": round(float(np.mean(any_hand_col)), 4),
        "bothHandsRatio": round(float(np.mean(both_hands_col)), 4),
        "poseDetected": bool(float(np.mean(pose_column)) >= 0.5),
    }
