from __future__ import annotations

import threading
import uuid

from fastapi.testclient import TestClient

from app.errors import BackendTimeoutError, BackendUnavailableError
from app.features import FEATURE_DIM, SEQUENCE_LENGTH, FeatureResult
from app.main import create_app
from app.processor import ProcessingResult
from app.schemas import VideoMetadata


TARGET_ID = "00000000-0000-0000-0000-000000000002"
SESSION_ID = "00000000-0000-0000-0000-000000000001"
MODEL_VERSION = "vsl-mvp30-v2-lite-transformer"


class FakeProcessor:
    def __init__(self) -> None:
        self.calls = 0

    def process(self, data: bytes, content_type: str) -> ProcessingResult:
        self.calls += 1
        return ProcessingResult(
            features=FeatureResult(
                features=[[0.0] * FEATURE_DIM for _ in range(SEQUENCE_LENGTH)],
                raw_frame_count=16,
                frame_count=16,
                quality={"handFrameRatio": 0.75, "bothHandsRatio": 0.5, "poseDetected": True},
            ),
            video=VideoMetadata(
                container="mp4",
                codec="avc1",
                width=640,
                height=480,
                sourceFps=30,
                durationMs=1200,
                decodedFrames=36,
                sampledFrames=20,
            ),
            decoding_ms=2.0,
            landmark_ms=10.0,
            preprocessing_ms=3.0,
        )

    def close(self) -> None:
        pass


class FakeBackend:
    def __init__(self, error: Exception | None = None) -> None:
        self.authorize_calls = 0
        self.score_calls = 0
        self.error = error

    async def authorize(self, *args: object) -> None:
        self.authorize_calls += 1
        if self.error:
            raise self.error

    async def score(self, *args: object) -> dict[str, object]:
        self.score_calls += 1
        if self.error:
            raise self.error
        return {
            "status": "verified",
            "verified": True,
            "predictedLabel": "Xin chào",
            "confidence": 0.91,
            "top3": [{"label": "Xin chào", "confidence": 0.91}],
            "qualityHints": [],
            "countedAgainstQuota": True,
            "quotaRemaining": 9,
        }

    async def close(self) -> None:
        pass


def _form(request_id: str | None = None) -> dict[str, str]:
    data = {
        "targetSignId": TARGET_ID,
        "modelVersion": MODEL_VERSION,
        "sessionId": SESSION_ID,
        "consent": "true",
    }
    if request_id:
        data["requestId"] = request_id
    return data


def _headers(token: str = "test-access-token") -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Origin": "https://app.test"}


def _files(payload: bytes = b"\x00\x00\x00\x18ftypisomvideo") -> dict[str, tuple[str, bytes, str]]:
    return {"video": ("sample.mp4", payload, "video/mp4")}


def test_valid_video_returns_authoritative_attempt(settings) -> None:
    processor = FakeProcessor()
    backend = FakeBackend()
    with TestClient(create_app(settings, processor=processor, backend=backend)) as client:
        response = client.post("/v1/video/infer", data=_form(), files=_files(), headers=_headers())

    assert response.status_code == 200
    payload = response.json()
    assert payload["verified"] is True
    assert payload["attempt"]["quotaRemaining"] == 9
    assert payload["video"]["sampledFrames"] == 20
    assert payload["extraction"] == {
        "rawLandmarkFrames": 16,
        "effectiveFrames": 16,
        "handFrameRatio": 0.75,
        "bothHandsRatio": 0.5,
        "poseDetected": True,
    }
    assert payload["retainedMedia"] is False
    assert payload["timings"]["landmarkExtractionMs"] == 10.0
    assert processor.calls == backend.score_calls == 1


def test_rejects_unauthorized_before_processing(settings) -> None:
    processor = FakeProcessor()
    backend = FakeBackend()
    with TestClient(create_app(settings, processor=processor, backend=backend)) as client:
        response = client.post("/v1/video/infer", data=_form(), files=_files())

    assert response.status_code == 401
    assert response.json()["errorCode"] == "unauthorized"
    assert processor.calls == backend.authorize_calls == 0


def test_requires_explicit_consent(settings) -> None:
    form = _form()
    form["consent"] = "false"
    with TestClient(create_app(settings, processor=FakeProcessor(), backend=FakeBackend())) as client:
        response = client.post("/v1/video/infer", data=form, files=_files(), headers=_headers())
    assert response.status_code == 400
    assert response.json()["errorCode"] == "consent_required"


def test_rejects_empty_and_oversized_uploads(settings) -> None:
    with TestClient(create_app(settings, processor=FakeProcessor(), backend=FakeBackend())) as client:
        empty = client.post("/v1/video/infer", data=_form(), files=_files(b""), headers=_headers())
        oversized = client.post(
            "/v1/video/infer",
            data=_form(),
            files=_files(b"x" * (settings.max_upload_bytes + 1)),
            headers=_headers(),
        )
    assert empty.status_code == 400
    assert empty.json()["errorCode"] == "empty_upload"
    assert oversized.status_code == 413
    assert oversized.json()["errorCode"] == "upload_too_large"


def test_rejects_unsupported_content_type(settings) -> None:
    files = {"video": ("sample.txt", b"hello", "text/plain")}
    with TestClient(create_app(settings, processor=FakeProcessor(), backend=FakeBackend())) as client:
        response = client.post("/v1/video/infer", data=_form(), files=files, headers=_headers())
    assert response.status_code == 415
    assert response.json()["errorCode"] == "unsupported_content_type"


def test_duplicate_request_id_is_scored_once(settings) -> None:
    request_id = str(uuid.uuid4())
    processor = FakeProcessor()
    backend = FakeBackend()
    with TestClient(create_app(settings, processor=processor, backend=backend)) as client:
        first = client.post("/v1/video/infer", data=_form(request_id), files=_files(), headers=_headers())
        second = client.post("/v1/video/infer", data=_form(request_id), files=_files(), headers=_headers())
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert processor.calls == backend.score_calls == 1


def test_request_cache_is_isolated_by_access_token(settings) -> None:
    request_id = str(uuid.uuid4())
    processor = FakeProcessor()
    backend = FakeBackend()
    with TestClient(create_app(settings, processor=processor, backend=backend)) as client:
        first = client.post(
            "/v1/video/infer",
            data=_form(request_id),
            files=_files(),
            headers=_headers("user-a"),
        )
        second = client.post(
            "/v1/video/infer",
            data=_form(request_id),
            files=_files(),
            headers=_headers("user-b"),
        )
    assert first.status_code == second.status_code == 200
    assert processor.calls == backend.score_calls == 2


def test_backend_timeout_and_unavailable_are_retryable(settings) -> None:
    for error, code in ((BackendTimeoutError(), 504), (BackendUnavailableError(), 503)):
        with TestClient(create_app(settings, processor=FakeProcessor(), backend=FakeBackend(error))) as client:
            response = client.post("/v1/video/infer", data=_form(), files=_files(), headers=_headers())
        assert response.status_code == code
        assert response.json()["retryable"] is True


def test_health_readiness_and_cors(settings) -> None:
    with TestClient(create_app(settings, processor=FakeProcessor(), backend=FakeBackend())) as client:
        assert client.get("/healthz").json() == {"status": "UP"}
        assert client.get("/readyz").json() == {"status": "UP"}
        response = client.options(
            "/v1/video/infer",
            headers={
                "Origin": "https://app.test",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "authorization,content-type,x-request-id",
            },
        )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://app.test"
