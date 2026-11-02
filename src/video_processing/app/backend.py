from __future__ import annotations

import uuid
from typing import Any

import httpx

from .config import Settings
from .errors import BackendTimeoutError, BackendUnavailableError, VideoServiceError
from .features import FeatureResult


class SpringBackendClient:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._owned_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=settings.backend_base_url,
            timeout=httpx.Timeout(settings.backend_timeout_seconds),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )

    async def authorize(
        self,
        authorization: str,
        target_sign_id: str,
        model_version: str,
        request_id: str,
    ) -> None:
        model_size = 400 if "400" in model_version else 30
        response = await self._request(
            "GET",
            "/api/v1/ai/capabilities",
            authorization,
            request_id,
            params={"modelSize": model_size},
        )
        result = self._unwrap(response)
        recognizable = {str(value) for value in result.get("recognizableSignIds", [])}
        if recognizable and target_sign_id not in recognizable:
            raise VideoServiceError("target_not_recognizable", "Ký hiệu này chưa được model hỗ trợ.", 409)
        actual_version = str(result.get("modelVersion", ""))
        if actual_version and actual_version != model_version:
            raise VideoServiceError("model_version_mismatch", "Phiên luyện đang dùng model không còn hiệu lực.", 409)

    async def score(
        self,
        authorization: str,
        request_id: str,
        target_sign_id: str,
        model_version: str,
        session_id: str | None,
        features: FeatureResult,
        duration_ms: int,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "requestId": request_id,
            "version": "1.0",
            "targetSignId": target_sign_id,
            "modelVersion": model_version,
            "features": features.features,
            "frameCount": features.frame_count,
            "durationMs": min(max(duration_ms, 1), 6000),
            "clientQuality": features.quality,
        }
        if session_id:
            payload["sessionId"] = session_id
        response = await self._request(
            "POST",
            "/api/v1/ai/attempts",
            authorization,
            request_id,
            json=payload,
        )
        return self._unwrap(response)

    async def close(self) -> None:
        if self._owned_client:
            await self._client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        authorization: str,
        request_id: str,
        **kwargs: Any,
    ) -> httpx.Response:
        try:
            response = await self._client.request(
                method,
                path,
                headers={"Authorization": authorization, "X-Request-Id": request_id},
                **kwargs,
            )
        except httpx.TimeoutException as error:
            raise BackendTimeoutError() from error
        except httpx.HTTPError as error:
            raise BackendUnavailableError() from error
        if response.status_code in {401, 403, 409, 413, 422, 429}:
            message = self._error_message(response)
            raise VideoServiceError("backend_rejected", message, response.status_code)
        if response.status_code == 504:
            raise BackendTimeoutError()
        if response.status_code >= 500:
            raise BackendUnavailableError()
        if response.status_code >= 400:
            raise VideoServiceError("backend_rejected", self._error_message(response), response.status_code)
        return response

    @staticmethod
    def _unwrap(response: httpx.Response) -> dict[str, Any]:
        data = response.json()
        if not isinstance(data, dict):
            raise BackendUnavailableError("Phản hồi từ backend không đúng định dạng.")
        if "errorCode" in data:
            if str(data.get("errorCode")) != "00000":
                raise VideoServiceError(
                    str(data.get("errorCode") or "backend_rejected"),
                    str(data.get("errorMessage") or "Backend từ chối yêu cầu."),
                    response.status_code,
                )
            result = data.get("result")
            if isinstance(result, dict):
                return result
            raise BackendUnavailableError("Backend không trả về kết quả chấm điểm.")
        return data

    @staticmethod
    def _error_message(response: httpx.Response) -> str:
        try:
            data = response.json()
            if isinstance(data, dict):
                return str(data.get("errorMessage") or data.get("message") or data.get("detail") or "Yêu cầu bị từ chối.")
        except ValueError:
            pass
        return "Yêu cầu bị backend từ chối."


def validate_uuid(value: str, field_name: str) -> str:
    try:
        return str(uuid.UUID(value))
    except (ValueError, AttributeError) as error:
        raise VideoServiceError("invalid_identifier", f"{field_name} không hợp lệ.", 422) from error
