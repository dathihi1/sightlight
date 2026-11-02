from __future__ import annotations

import time
from typing import Any


class UploadTimingMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return
        scope.setdefault("state", {})["request_started_at"] = time.perf_counter()

        async def timed_receive() -> dict[str, Any]:
            message = await receive()
            if message.get("type") == "http.request" and not message.get("more_body", False):
                scope["state"]["upload_finished_at"] = time.perf_counter()
            return message

        await self.app(scope, timed_receive, send)
