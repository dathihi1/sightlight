from __future__ import annotations

import asyncio
import hashlib
import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, File, Form, Header, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .backend import SpringBackendClient, validate_uuid
from .config import Settings
from .deduplication import RequestDeduplicator
from .errors import VideoServiceError
from .landmarks import MediaPipeHolisticExtractor
from .processor import ProcessingResult, VideoProcessor
from .schemas import ErrorResponse, ExtractionQuality, ProcessingTimings, VideoInferenceResponse
from .timing import UploadTimingMiddleware
from .video import ALLOWED_CONTENT_TYPES, OpenCvVideoDecoder

log = logging.getLogger("signlight.video_processing")


def create_app(
    settings: Settings | None = None,
    *,
    processor: Any | None = None,
    backend: Any | None = None,
) -> FastAPI:
    service_settings = settings or Settings.from_env()
    injected_processor = processor
    injected_backend = backend

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        logging.basicConfig(
            level=getattr(logging, service_settings.log_level, logging.INFO),
            format='{"ts":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
        )
        app.state.ready = False
        app.state.processor = injected_processor or VideoProcessor(
            OpenCvVideoDecoder(service_settings),
            MediaPipeHolisticExtractor(service_settings.holistic_model_path),
        )
        app.state.backend = injected_backend or SpringBackendClient(service_settings)
        app.state.semaphore = asyncio.Semaphore(service_settings.processing_concurrency)
        app.state.deduplicator = RequestDeduplicator(service_settings.request_cache_ttl_seconds)
        app.state.ready = True
        try:
            yield
        finally:
            app.state.ready = False
            close_processor = getattr(app.state.processor, "close", None)
            if close_processor:
                close_processor()
            close_backend = getattr(app.state.backend, "close", None)
            if close_backend:
                value = close_backend()
                if asyncio.iscoroutine(value):
                    await value

    app = FastAPI(
        title="SignLight Video Processing Service",
        version="1.0.0",
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
        lifespan=lifespan,
    )
    app.state.settings = service_settings
    app.add_middleware(UploadTimingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(service_settings.allowed_origins),
        allow_credentials=False,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
        expose_headers=["X-Request-Id"],
        max_age=600,
    )

    @app.middleware("http")
    async def reject_oversized_body(request: Request, call_next: Any) -> Any:
        content_length = request.headers.get("content-length")
        multipart_overhead = 1024 * 1024
        if content_length and int(content_length) > service_settings.max_upload_bytes + multipart_overhead:
            return _error_response(request, "upload_too_large", "Video vượt quá dung lượng cho phép.", 413)
        return await call_next(request)

    @app.exception_handler(VideoServiceError)
    async def video_service_error(request: Request, error: VideoServiceError) -> JSONResponse:
        return _error_response(
            request,
            error.code,
            error.message,
            error.status_code,
            retryable=error.status_code in {429, 503, 504},
        )

    @app.get("/healthz")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    @app.get("/readyz")
    async def readiness(request: Request) -> JSONResponse:
        ready = bool(getattr(request.app.state, "ready", False))
        return JSONResponse(status_code=200 if ready else 503, content={"status": "UP" if ready else "DOWN"})

    @app.post(
        "/v1/video/infer",
        response_model=VideoInferenceResponse,
        responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    )
    async def infer_video(
        request: Request,
        video: UploadFile = File(...),
        target_sign_id: str = Form(..., alias="targetSignId"),
        requested_model_version: str = Form(..., alias="modelVersion"),
        consent: bool = Form(...),
        session_id: str | None = Form(default=None, alias="sessionId"),
        form_request_id: str | None = Form(default=None, alias="requestId"),
        authorization: str | None = Header(default=None),
        header_request_id: str | None = Header(default=None, alias="X-Request-Id"),
    ) -> VideoInferenceResponse:
        request_id = _request_id(header_request_id or form_request_id)
        request.state.request_id = request_id
        if not authorization or not authorization.startswith("Bearer "):
            raise VideoServiceError("unauthorized", "Cần đăng nhập để gửi video nhận diện.", 401)
        if not consent:
            raise VideoServiceError("consent_required", "Bạn phải đồng ý tải video lên để dùng chế độ xử lý máy chủ.", 400)
        target_sign_id = validate_uuid(target_sign_id, "targetSignId")
        if session_id:
            session_id = validate_uuid(session_id, "sessionId")
        if not requested_model_version or len(requested_model_version) > 100:
            raise VideoServiceError("invalid_model_version", "modelVersion không hợp lệ.", 422)
        content_type = (video.content_type or "").lower().split(";", 1)[0]
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise VideoServiceError("unsupported_content_type", "Chỉ hỗ trợ video MP4, MOV hoặc WebM.", 415)

        async def execute() -> VideoInferenceResponse:
            started = time.perf_counter()
            upload_finished = request.scope.get("state", {}).get("upload_finished_at", started)
            request_started = request.scope.get("state", {}).get("request_started_at", upload_finished)
            authorization_started = time.perf_counter()
            await request.app.state.backend.authorize(
                authorization,
                target_sign_id,
                requested_model_version,
                request_id,
            )
            authorization_ms = (time.perf_counter() - authorization_started) * 1000

            data = await video.read(service_settings.max_upload_bytes + 1)
            await video.close()
            if not data:
                raise VideoServiceError("empty_upload", "Video tải lên đang trống.", 400)
            if len(data) > service_settings.max_upload_bytes:
                raise VideoServiceError("upload_too_large", "Video vượt quá dung lượng cho phép.", 413)

            acquired = False
            try:
                await asyncio.wait_for(
                    request.app.state.semaphore.acquire(),
                    timeout=service_settings.acquire_timeout_seconds,
                )
                acquired = True
            except TimeoutError as error:
                raise VideoServiceError(
                    "service_busy",
                    "Máy chủ đang xử lý lượt khác. Vui lòng thử lại sau vài giây.",
                    429,
                ) from error

            try:
                processed: ProcessingResult = await asyncio.to_thread(
                    request.app.state.processor.process,
                    data,
                    content_type,
                )
            finally:
                data = b""
                if acquired:
                    request.app.state.semaphore.release()

            backend_started = time.perf_counter()
            attempt = await request.app.state.backend.score(
                authorization,
                request_id,
                target_sign_id,
                requested_model_version,
                session_id,
                processed.features,
                processed.video.durationMs,
            )
            backend_ms = (time.perf_counter() - backend_started) * 1000
            total_ms = (time.perf_counter() - started) * 1000
            timings = ProcessingTimings(
                uploadMs=max(0.0, (upload_finished - request_started) * 1000),
                authorizationMs=authorization_ms,
                videoDecodingMs=processed.decoding_ms,
                landmarkExtractionMs=processed.landmark_ms,
                tensorPreprocessingMs=processed.preprocessing_ms,
                backendAndAiMs=backend_ms,
                totalMs=total_ms,
            )
            top_k = attempt.get("top3") or []
            response = VideoInferenceResponse(
                requestId=request_id,
                status=str(attempt.get("status", "unknown")),
                predictedLabel=attempt.get("predictedLabel"),
                confidence=attempt.get("confidence"),
                topK=top_k if isinstance(top_k, list) else [],
                modelVersion=requested_model_version,
                verified=bool(attempt.get("verified", False)),
                qualityHints=[str(value) for value in (attempt.get("qualityHints") or [])],
                processingTimeMs=round(total_ms, 3),
                timings=timings,
                video=processed.video,
                extraction=ExtractionQuality(
                    rawLandmarkFrames=processed.features.raw_frame_count,
                    effectiveFrames=processed.features.frame_count,
                    handFrameRatio=float(processed.features.quality.get("handFrameRatio", 0.0)),
                    bothHandsRatio=float(processed.features.quality.get("bothHandsRatio", 0.0)),
                    poseDetected=bool(processed.features.quality.get("poseDetected", False)),
                ),
                retainedMedia=False,
                attempt=attempt,
            )
            log.info(
                "video_inference requestId=%s status=%s totalMs=%.1f sampledFrames=%d retainedMedia=false",
                request_id,
                response.status,
                total_ms,
                processed.video.sampledFrames,
            )
            return response

        deduplication_key = hashlib.sha256(f"{authorization}:{request_id}".encode()).hexdigest()
        return await request.app.state.deduplicator.run(deduplication_key, execute)

    return app


def _request_id(value: str | None) -> str:
    if not value:
        return str(uuid.uuid4())
    try:
        return str(uuid.UUID(value))
    except ValueError as error:
        raise VideoServiceError("invalid_request_id", "requestId không hợp lệ.", 422) from error


def _error_response(
    request: Request,
    code: str,
    message: str,
    status_code: int,
    retryable: bool = False,
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-Id") or str(uuid.uuid4())
    return JSONResponse(
        status_code=status_code,
        headers={"X-Request-Id": request_id},
        content=ErrorResponse(
            requestId=request_id,
            errorCode=code,
            message=message,
            retryable=retryable,
        ).model_dump(),
    )


app = create_app()
