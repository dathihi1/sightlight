from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _origins(value: str) -> tuple[str, ...]:
    return tuple(origin.strip().rstrip("/") for origin in value.split(",") if origin.strip())


@dataclass(frozen=True, slots=True)
class Settings:
    backend_base_url: str
    holistic_model_path: Path
    allowed_origins: tuple[str, ...]
    max_upload_bytes: int = 10 * 1024 * 1024
    max_duration_ms: int = 6_000
    min_duration_ms: int = 400
    max_width: int = 1_280
    max_height: int = 720
    target_sample_fps: float = 16.0
    max_sampled_frames: int = 64
    processing_concurrency: int = 1
    acquire_timeout_seconds: float = 0.05
    backend_timeout_seconds: float = 8.0
    request_cache_ttl_seconds: int = 120
    require_https_backend: bool = True
    log_level: str = "INFO"

    @classmethod
    def from_env(cls) -> "Settings":
        root = Path(__file__).resolve().parent.parent
        backend = os.getenv(
            "SPRING_BACKEND_BASE_URL",
            os.getenv("BACKEND_BASE_URL", "http://host.docker.internal:8080"),
        ).rstrip("/")
        if _bool("REQUIRE_HTTPS_BACKEND", False) and not backend.startswith("https://"):
            raise RuntimeError("BACKEND_BASE_URL must use HTTPS when REQUIRE_HTTPS_BACKEND=true")
        return cls(
            backend_base_url=backend,
            holistic_model_path=Path(
                os.getenv("HOLISTIC_MODEL_PATH", str(root / "models" / "holistic_landmarker.task"))
            ),
            allowed_origins=_origins(
                os.getenv(
                    "ALLOWED_ORIGINS",
                    "http://localhost:3000,http://localhost:8080,https://signlight.id.vn",
                )
            ),
            max_upload_bytes=int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024))),
            max_duration_ms=int(os.getenv("MAX_VIDEO_DURATION_MS", os.getenv("MAX_DURATION_MS", "6000"))),
            min_duration_ms=int(os.getenv("MIN_DURATION_MS", "400")),
            max_width=int(os.getenv("MAX_VIDEO_WIDTH", "1280")),
            max_height=int(os.getenv("MAX_VIDEO_HEIGHT", "720")),
            target_sample_fps=float(os.getenv("TARGET_SAMPLE_FPS", "16")),
            max_sampled_frames=int(os.getenv("MAX_SAMPLED_FRAMES", "64")),
            processing_concurrency=max(1, int(os.getenv("PROCESSING_CONCURRENCY", "1"))),
            acquire_timeout_seconds=float(os.getenv("ACQUIRE_TIMEOUT_SECONDS", "0.05")),
            backend_timeout_seconds=float(os.getenv("BACKEND_TIMEOUT_SECONDS", "8")),
            request_cache_ttl_seconds=int(os.getenv("REQUEST_CACHE_TTL_SECONDS", "120")),
            require_https_backend=_bool("REQUIRE_HTTPS_BACKEND", False),
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        )
