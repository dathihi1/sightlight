from __future__ import annotations

import argparse
import json
import statistics
import threading
import time
from pathlib import Path

import psutil

from app.config import Settings
from app.landmarks import MediaPipeHolisticExtractor
from app.processor import VideoProcessor
from app.video import OpenCvVideoDecoder


def main() -> int:
    parser = argparse.ArgumentParser(description="Benchmark SignLight video processing on one logical CPU.")
    parser.add_argument("video", type=Path)
    parser.add_argument("--iterations", type=int, default=3)
    parser.add_argument("--model", type=Path, default=Path("models/holistic_landmarker.task"))
    args = parser.parse_args()

    process = psutil.Process()
    affinity = process.cpu_affinity() if hasattr(process, "cpu_affinity") else []
    if affinity:
        process.cpu_affinity([affinity[0]])

    settings = Settings.from_env()
    settings = Settings(
        backend_base_url=settings.backend_base_url,
        holistic_model_path=args.model,
        allowed_origins=settings.allowed_origins,
        max_upload_bytes=settings.max_upload_bytes,
        max_duration_ms=settings.max_duration_ms,
        min_duration_ms=settings.min_duration_ms,
        max_width=settings.max_width,
        max_height=settings.max_height,
        target_sample_fps=settings.target_sample_fps,
        max_sampled_frames=settings.max_sampled_frames,
        processing_concurrency=1,
    )
    data = args.video.read_bytes()
    content_type = "video/webm" if args.video.suffix.lower() == ".webm" else "video/mp4"
    processor = VideoProcessor(
        OpenCvVideoDecoder(settings),
        MediaPipeHolisticExtractor(args.model),
    )

    peak_rss = process.memory_info().rss
    stop_monitor = threading.Event()

    def monitor() -> None:
        nonlocal peak_rss
        while not stop_monitor.wait(0.02):
            peak_rss = max(peak_rss, process.memory_info().rss)

    monitor_thread = threading.Thread(target=monitor, daemon=True)
    monitor_thread.start()
    runs: list[dict[str, object]] = []
    try:
        for index in range(max(1, args.iterations)):
            started = time.perf_counter()
            result = processor.process(data, content_type)
            wall_ms = (time.perf_counter() - started) * 1000
            runs.append(
                {
                    "run": index + 1,
                    "wallMs": round(wall_ms, 2),
                    "decodeMs": round(result.decoding_ms, 2),
                    "landmarkMs": round(result.landmark_ms, 2),
                    "preprocessMs": round(result.preprocessing_ms, 2),
                    "video": result.video.model_dump(),
                    "rawLandmarkFrames": result.features.raw_frame_count,
                    "effectiveFrames": result.features.frame_count,
                    "quality": result.features.quality,
                }
            )
    finally:
        stop_monitor.set()
        monitor_thread.join(timeout=1)
        processor.close()
        if affinity:
            process.cpu_affinity(affinity)

    wall_values = [float(run["wallMs"]) for run in runs]
    report = {
        "logicalCpuLimit": 1 if affinity else None,
        "memoryLimitTargetMiB": 2048,
        "peakRssMiB": round(peak_rss / 1024 / 1024, 2),
        "inputBytes": len(data),
        "iterations": len(runs),
        "medianWallMs": round(statistics.median(wall_values), 2),
        "maxWallMs": round(max(wall_values), 2),
        "runs": runs,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
