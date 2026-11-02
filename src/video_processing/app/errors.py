from __future__ import annotations


class VideoServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class InvalidVideoError(VideoServiceError):
    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        super().__init__(code, message, status_code)


class BackendUnavailableError(VideoServiceError):
    def __init__(self, message: str = "Dịch vụ chấm điểm tạm thời không khả dụng.") -> None:
        super().__init__("backend_unavailable", message, 503)


class BackendTimeoutError(VideoServiceError):
    def __init__(self) -> None:
        super().__init__("backend_timeout", "Dịch vụ chấm điểm phản hồi quá lâu.", 504)
