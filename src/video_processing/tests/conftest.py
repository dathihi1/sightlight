from __future__ import annotations

from pathlib import Path
import sys

import pytest

SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.config import Settings


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return Settings(
        backend_base_url="https://spring.test",
        holistic_model_path=tmp_path / "unused.task",
        allowed_origins=("https://app.test",),
        max_upload_bytes=1_024,
        max_duration_ms=6_000,
        min_duration_ms=400,
        processing_concurrency=1,
        acquire_timeout_seconds=0.01,
        backend_timeout_seconds=0.1,
    )
