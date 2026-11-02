from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from collections.abc import Awaitable, Callable
from typing import Any


class RequestDeduplicator:
    def __init__(self, ttl_seconds: int, max_entries: int = 1_000) -> None:
        self._ttl_seconds = ttl_seconds
        self._max_entries = max_entries
        self._lock = asyncio.Lock()
        self._tasks: dict[str, asyncio.Task[Any]] = {}
        self._cache: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    async def run(self, key: str, factory: Callable[[], Awaitable[Any]]) -> Any:
        async with self._lock:
            self._purge()
            cached = self._cache.get(key)
            if cached is not None:
                return cached[1]
            task = self._tasks.get(key)
            if task is None:
                task = asyncio.create_task(factory())
                self._tasks[key] = task
        try:
            result = await asyncio.shield(task)
        except Exception:
            async with self._lock:
                if self._tasks.get(key) is task:
                    self._tasks.pop(key, None)
            raise
        async with self._lock:
            if self._tasks.get(key) is task:
                self._tasks.pop(key, None)
                self._cache[key] = (time.monotonic() + self._ttl_seconds, result)
                while len(self._cache) > self._max_entries:
                    self._cache.popitem(last=False)
        return result

    def _purge(self) -> None:
        now = time.monotonic()
        expired = [key for key, (expires_at, _) in self._cache.items() if expires_at <= now]
        for key in expired:
            self._cache.pop(key, None)
