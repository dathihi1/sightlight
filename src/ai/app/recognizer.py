"""Nạp mô hình ONNX và phân lớp tensor 64×327.

Hai chế độ chạy:

* **ONNX** — có `model.onnx` trong `MODEL_DIR` (bản INT8 của repo EXE101, `vsl_mvp30_v2_lite_transformer`).
  Đây là chế độ duy nhất được phép dùng ở UAT/prod.
* **STUB** — không tìm thấy mô hình. Dịch vụ vẫn chạy để demo được luồng đầu-cuối, nhưng
  `model_version` bị gắn hậu tố `-stub` và `stub_mode = True` ở mọi phản hồi.
  ⚠️ **Số liệu ở chế độ này KHÔNG có ý nghĩa về độ chính xác** — không được dùng để nghiệm thu NFR-19.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from pathlib import Path

import numpy as np

from .labels import load_labels, stable_sign_id
from .schema import FEATURE_DIM, SCHEMA_VERSION, SEQUENCE_LENGTH, SLICES

log = logging.getLogger(__name__)

DEFAULT_VERSION_CODE = "vsl-mvp30-v2-lite-transformer"
DEFAULT_CONFIDENCE_THRESHOLD = 0.55
DEFAULT_CONFIDENCE_MARGIN = 0.03


class Recognizer:
    """Bọc phiên ONNX. Không chạm CSDL, không ghi gì xuống đĩa (ADR-10, NFR-12)."""

    def __init__(self, model_dir: Path) -> None:
        self.model_dir = model_dir
        self.labels = load_labels(model_dir)
        self.stable_ids = [stable_sign_id(label) for label in self.labels]
        self.sequence_length = SEQUENCE_LENGTH
        self.feature_dim = FEATURE_DIM
        self.schema_version = SCHEMA_VERSION
        self.confidence_threshold = DEFAULT_CONFIDENCE_THRESHOLD
        self.confidence_margin = DEFAULT_CONFIDENCE_MARGIN
        self._session = None
        self._input_name = ""
        self._load_config()
        self._load_session()

    # ------------------------------------------------------------------ nạp

    def _load_config(self) -> None:
        config_file = self.model_dir / "config.json"
        if not config_file.is_file():
            log.warning("Không có config.json trong %s — dùng giá trị mặc định", self.model_dir)
            return
        cfg = json.loads(config_file.read_text(encoding="utf-8"))
        self.sequence_length = int(cfg.get("sequence_length", self.sequence_length))
        self.feature_dim = int(cfg.get("feature_dim", self.feature_dim))
        self.schema_version = cfg.get("schema_version", self.schema_version)
        self.confidence_threshold = float(cfg.get("confidence_threshold", self.confidence_threshold))
        self.confidence_margin = float(cfg.get("confidence_margin", self.confidence_margin))
        if self.feature_dim != FEATURE_DIM or self.sequence_length != SEQUENCE_LENGTH:
            # Sai ở đây nghĩa là client đang trích đặc trưng theo một schema khác -> dừng sớm.
            raise RuntimeError(
                f"config.json khai {self.sequence_length}x{self.feature_dim}, "
                f"không khớp schema {SEQUENCE_LENGTH}x{FEATURE_DIM} mà client đang trích"
            )

    def _load_session(self) -> None:
        candidates = ["model.int8.onnx", "model_int8.onnx", "model.onnx", "model_fp32.onnx"]
        for name in candidates:
            path = self.model_dir / name
            if path.is_file():
                import onnxruntime as ort  # nạp trễ: chế độ stub không cần

                options = ort.SessionOptions()
                options.intra_op_num_threads = int(os.getenv("INFERENCE_WORKERS", "2"))
                self._session = ort.InferenceSession(
                    str(path), options, providers=["CPUExecutionProvider"]
                )
                self._input_name = self._session.get_inputs()[0].name
                log.info("Đã nạp mô hình ONNX %s (%d lớp)", path.name, len(self.labels))
                return
        log.warning(
            "KHÔNG tìm thấy mô hình trong %s (%s) — chạy CHẾ ĐỘ STUB. "
            "Kết quả nhận dạng là giả lập, chỉ dùng để demo luồng.",
            self.model_dir, ", ".join(candidates),
        )

    # --------------------------------------------------------------- thuộc tính

    @property
    def stub_mode(self) -> bool:
        return self._session is None

    @property
    def version_code(self) -> str:
        base = os.getenv("MODEL_VERSION_CODE", self.model_dir.name.replace("_", "-"))
        return f"{base}-stub" if self.stub_mode else base

    @property
    def num_classes(self) -> int:
        return len(self.labels)

    def label_catalog(self) -> list[dict]:
        return [
            {"index": i, "label": label, "stableSignId": self.stable_ids[i]}
            for i, label in enumerate(self.labels)
        ]

    # ------------------------------------------------------------- suy luận

    def infer(self, features: np.ndarray) -> tuple[np.ndarray, float]:
        """Trả `(xác suất theo lớp, độ trễ ms)`. `features` đã được kiểm kích thước ở tầng gọi."""
        started = time.perf_counter()
        if self._session is None:
            probs = self._stub_probabilities(features)
        else:
            batch = features.astype(np.float32)[None, :, :]
            outputs = self._session.run(None, {self._input_name: batch})
            probs = _softmax(np.asarray(outputs[0], dtype=np.float64).reshape(-1))
        latency_ms = (time.perf_counter() - started) * 1000.0
        return probs, latency_ms

    def _stub_probabilities(self, features: np.ndarray) -> np.ndarray:
        """Sinh phân phối **tất định theo nội dung tensor** — cùng động tác cho cùng kết quả.

        Không phải mô hình: chỉ băm tensor để demo có kết quả ổn định và tái lặp được.
        """
        digest = hashlib.sha256(np.ascontiguousarray(features.astype(np.float32)).tobytes()).digest()
        rng = np.random.default_rng(int.from_bytes(digest[:8], "big"))
        logits = rng.normal(0.0, 1.0, size=self.num_classes)
        # Lát `quality` quyết định độ sắc nét: khung hình tốt -> mô hình "tự tin" hơn.
        q_start, q_end = SLICES["quality"]
        quality_mean = float(np.clip(np.mean(features[:, q_start:q_end]), 0.0, 1.0))
        logits[int(digest[8]) % self.num_classes] += 2.0 + 4.0 * quality_mean
        return _softmax(logits)


def _softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - np.max(values)
    exponentials = np.exp(shifted)
    return exponentials / np.sum(exponentials)
