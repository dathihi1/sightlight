"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { ApiError, apiCall } from "@/lib/api";
import {
  MAX_RECORDING_MS,
  MIN_USEFUL_FRAMES,
  TARGET_SAMPLE_FPS,
} from "@/lib/holistic/featureSchema";
import type { LocalInferenceResult } from "@/lib/ai/localRecognizer";

interface Capabilities {
  modelVersion: string;
  sequenceLength: number;
  featureDim: number;
  minFrames: number;
  maxFrames: number;
  recognizableSignIds: string[];
  attributionText: string;
  disclaimerText: string;
  stubMode: boolean;
}

interface PracticeSession {
  sessionId: string;
  modelVersion: string;
  items: PracticeItem[];
}

interface PracticeItem {
  signId: string;
  label: string;
  topic: string | null;
  videoUrl: string | null;
  placeholderVideo: boolean;
}

interface AttemptResult {
  attemptId: string;
  verified: boolean;
  status: string;
  confidence: number | null;
  predictedSignId: string | null;
  predictedLabel: string | null;
  top3: { signId: string | null; label: string; confidence: number }[] | null;
  qualityHints: string[];
  countedAgainstQuota: boolean;
  quotaRemaining?: number | null;
  consecutiveFailures: number;
  stubMode: boolean;
}

type Phase = "idle" | "loading-model" | "ready" | "recording" | "scoring";

export default function AiPracticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-[var(--color-ink-600)]">Đang tải không gian luyện AI…</p>
        </div>
      }
    >
      <AiPracticeContent />
    </Suspense>
  );
}

/** SCR-31 — luyện ký hiệu động với AI (FR-41 → FR-43). */
function AiPracticeContent() {
  const searchParams = useSearchParams();
  const requestedSignId = searchParams.get("signId");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<import("@/lib/holistic/extractor").SignSequenceRecorder | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [itemIndex, setItemIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [localInference, setLocalInference] = useState<LocalInferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const capabilities = useQuery({
    queryKey: ["ai-capabilities"],
    queryFn: () => apiCall<Capabilities>("/api/v1/ai/capabilities"),
  });

  const session = useQuery({
    queryKey: ["ai-practice-session", requestedSignId],
    queryFn: () => {
      const url = requestedSignId
        ? `/api/v1/ai/practice/session?size=10&signId=${encodeURIComponent(requestedSignId)}`
        : "/api/v1/ai/practice/session?size=10";
      return apiCall<PracticeSession>(url);
    },
  });

  const item = session.data?.items[itemIndex] ?? null;

  /** Dọn camera khi rời trang — không để đèn camera sáng sau khi người dùng đã đi. */
  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function startCamera() {
    setError(null);
    setPhase("loading-model");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const [{ loadHolisticLandmarker, SignSequenceRecorder }, { localRecognizer }] = await Promise.all([
        import("@/lib/holistic/extractor"),
        import("@/lib/ai/localRecognizer"),
      ]);
      recorderRef.current ??= new SignSequenceRecorder();
      const modelToLoad = capabilities.data?.modelVersion?.includes("30")
        ? "vsl_mvp30_v2_lite_transformer"
        : "vsl_mvp400_v2_lite_transformer";

      const [landmarkerResult, recognizerResult] = await Promise.all([
        loadHolisticLandmarker(),
        localRecognizer.load(modelToLoad),
      ]);
      if (!landmarkerResult || !recognizerResult) {
        throw new Error("Không tải được mô hình nhận dạng.");
      }
      setPhase("ready");
    } catch (caught) {
      stopCamera();
      setPhase("idle");
      setError(
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Bạn cần cho phép truy cập camera để luyện ký hiệu."
          : "Không khởi động được camera hoặc mô hình nhận dạng.",
      );
    }
  }

  async function startRecording() {
    if (!videoRef.current || !item || !capabilities.data) return;
    setResult(null);
    setLocalInference(null);
    setError(null);
    if (!recorderRef.current) {
      setError("Mô hình luyện tập chưa sẵn sàng. Hãy khởi động camera trước.");
      return;
    }
    setPhase("recording");

    try {
      const [{ loadHolisticLandmarker }, { localRecognizer }] = await Promise.all([
        import("@/lib/holistic/extractor"),
        import("@/lib/ai/localRecognizer"),
      ]);
      const landmarker = await loadHolisticLandmarker();
      const recorder = recorderRef.current;
      if (!recorder) return;
      recorder.start();

    const beganAt = performance.now();
    const frameIntervalMs = 1000 / TARGET_SAMPLE_FPS;
    let lastSampleAt = 0;
    let lastTimestamp = 0;

    const tick = () => {
      const video = videoRef.current;
      if (!video) return;

      const now = performance.now();
      const elapsed = now - beganAt;
      setElapsedMs(Math.round(elapsed));

      // Lấy mẫu đều tay ~16 khung/giây: đủ dày để bắt chuyển động, đủ thưa để không quá 32 khung.
      // Chỉ lấy mẫu khi khung hình đã thực sự decode (readyState >= 2) và có kích thước hợp lệ.
      if (
        now - lastSampleAt >= frameIntervalMs &&
        video.readyState >= 2 &&
        video.videoWidth > 0
      ) {
        lastSampleAt = now;
        // MediaPipe detectForVideo yêu cầu timestamp tăng đơn điệu — ép tăng ít nhất 1ms mỗi khung.
        const frameTime = Math.max(now, lastTimestamp + 1);
        lastTimestamp = frameTime;
        try {
          recorder.addFrame(landmarker.detectForVideo(video, frameTime));
        } catch (frameErr) {
          console.warn("Lỗi MediaPipe detectForVideo:", frameErr);
        }
      }

      // Tự dừng ở 5 giây (BR-A119) hoặc khi đã đủ 32 khung hữu ích.
      if (elapsed >= MAX_RECORDING_MS || recorder.isFull) {
        void finishRecording();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

      rafRef.current = requestAnimationFrame(tick);
    } catch (caught) {
      setPhase("ready");
      setError(caught instanceof Error ? caught.message : "Không tải được mô hình luyện tập.");
    }
  }

  async function finishRecording() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const recorder = recorderRef.current;
    if (!recorder) return;
    const extraction = recorder.finish();
    setPhase("scoring");

    // Cổng chất lượng tại chỗ (BR-A118): thiếu khung hữu ích thì không gửi đi, không tốn hạn mức.
    if (extraction.frameCount < MIN_USEFUL_FRAMES) {
      setResult({
        attemptId: "local",
        verified: false,
        status: "not_enough_frames",
        confidence: null,
        predictedSignId: null,
        predictedLabel: null,
        top3: null,
        qualityHints: ["Thực hiện trọn động tác trong khoảng hai giây."],
        countedAgainstQuota: false,
        quotaRemaining: null,
        consecutiveFailures: 0,
        stubMode: capabilities.data?.stubMode ?? false,
      });
      setPhase("ready");
      return;
    }

    // 1. Chạy suy luận cục bộ tức thì với ONNX Runtime Web (WASM)
    let localRecognizer: typeof import("@/lib/ai/localRecognizer").localRecognizer;
    try {
      ({ localRecognizer } = await import("@/lib/ai/localRecognizer"));
    } catch {
      setPhase("ready");
      setError("Không tải được mô hình nhận dạng cục bộ.");
      return;
    }
    let localInf: LocalInferenceResult | null = null;
    if (localRecognizer.isReady) {
      try {
        localInf = await localRecognizer.inferAsync(extraction.features);
        if (localInf) {
          setLocalInference(localInf);
        }
      } catch (err) {
        console.warn("Client inference error:", err);
      }
    }

    // 2. Gửi tensor lên backend API để ghi nhận lịch sử và hạn mức
    try {
      const scored = await apiCall<AttemptResult>("/api/v1/ai/attempts", {
        method: "POST",
        body: {
          targetSignId: item?.signId,
          modelVersion: capabilities.data?.modelVersion,
          features: extraction.features,
          frameCount: extraction.frameCount,
          durationMs: Math.min(extraction.durationMs, 6000),
          clientQuality: extraction.quality,
          sessionId: session.data?.sessionId,
        },
      });
      // Backend đang ở chế độ mô phỏng (chưa nạp trọng số mô hình): ưu tiên kết quả suy luận
      // cục bộ WASM thật thay vì hiện kết quả giả lập cho người dùng.
      if (scored.stubMode && localInf && item) {
        const isMatched = localInf.predictedLabel.toLowerCase().trim() === item.label.toLowerCase().trim();
        setResult({
          ...scored,
          verified: isMatched,
          status: isMatched ? "ok" : "wrong_target",
          confidence: localInf.confidence,
          predictedLabel: localInf.predictedLabel,
          top3: localInf.top3.map((t) => ({ signId: null, label: t.label, confidence: t.confidence })),
          qualityHints: [`Nhận diện trực tiếp qua WebAssembly (${Math.round(localInf.latencyMs)}ms).`],
        });
      } else {
        setResult(scored);
      }
    } catch (caught) {
      if (localInf && item) {
        const isMatched = localInf.predictedLabel.toLowerCase().trim() === item.label.toLowerCase().trim();
        setResult({
          attemptId: "client-wasm-" + Date.now(),
          verified: isMatched,
          status: isMatched ? "ok" : "wrong_target",
          confidence: localInf.confidence,
          predictedSignId: null,
          predictedLabel: localInf.predictedLabel,
          top3: localInf.top3.map((t) => ({ signId: null, label: t.label, confidence: t.confidence })),
          qualityHints: [`Nhận diện trực tiếp qua WebAssembly (${Math.round(localInf.latencyMs)}ms).`],
          countedAgainstQuota: false,
          quotaRemaining: null,
          consecutiveFailures: 0,
          stubMode: false,
        });
      } else {
        setError(caught instanceof ApiError ? caught.errorMessage : "Không chấm được lượt này.");
      }
    } finally {
      setPhase("ready");
    }
  }

  if (capabilities.isError) {
    const message =
      capabilities.error instanceof ApiError && capabilities.error.httpStatus === 401
        ? "Bạn cần đăng nhập để dùng phần luyện với AI."
        : "Hệ thống chấm tự động chưa sẵn sàng.";
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <ErrorNotice message={message} />
        <Link href="/dang-nhap" className="text-[var(--color-brand-600)] underline">
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (capabilities.isLoading || session.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[var(--color-ink-600)]">Đang chuẩn bị phiên luyện…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorNotice message="Chưa có ký hiệu nào được hỗ trợ chấm tự động trong phiên này." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Luyện ký hiệu với AI</h1>
        <p className="text-sm text-[var(--color-ink-600)]">{capabilities.data?.disclaimerText}</p>
        {capabilities.data?.stubMode && (
          // Không để ai nhầm kết quả giả lập với độ chính xác thật của mô hình.
          <p className="rounded-lg bg-[var(--color-brand-050)] px-3 py-2 text-xs text-[var(--color-brand-600)]">
            Dịch vụ AI đang chạy ở chế độ mô phỏng (chưa nạp trọng số mô hình). Kết quả dưới đây chỉ để
            minh hoạ luồng, không phản ánh độ chính xác thật.
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-semibold">Ký hiệu cần thực hiện: {item.label}</h2>
          <SignVideoPlayer
            key={item.signId}
            videoUrl={item.videoUrl}
            placeholderVideo={item.placeholderVideo}
            title={`Video mẫu — ${item.label}`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setItemIndex((current) =>
                  Math.min(current + 1, (session.data?.items.length ?? 1) - 1),
                );
                setResult(null);
              }}
              className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm"
            >
              Bỏ qua ký hiệu này
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Camera của bạn</h2>
          <div className="relative overflow-hidden rounded-xl bg-[var(--color-bg-video)]">
            <video
              ref={videoRef}
              muted
              playsInline
              className="aspect-video w-full scale-x-[-1] object-cover"
            />
            {phase === "recording" && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                <span aria-hidden="true">●</span>
                {/* Đồng hồ đếm để người học biết nhịp độ mong đợi (~2 giây) — BR-A120. */}
                <span>{(elapsedMs / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>

          {phase === "idle" && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-3 font-medium text-white hover:bg-[var(--color-brand-700)]"
            >
              Bật camera
            </button>
          )}
          {phase === "loading-model" && (
            <p className="text-sm text-[var(--color-ink-600)]">Đang nạp mô hình nhận dạng…</p>
          )}
          {phase === "ready" && (
            <button
              type="button"
              onClick={startRecording}
              className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-3 font-medium text-white hover:bg-[var(--color-brand-700)]"
            >
              Bắt đầu thực hiện ký hiệu
            </button>
          )}
          {phase === "recording" && (
            <button
              type="button"
              onClick={finishRecording}
              className="w-full rounded-lg border-2 border-[var(--color-brand-600)] px-4 py-3 font-medium"
            >
              Kết thúc
            </button>
          )}
          {phase === "scoring" && (
            <p className="text-sm text-[var(--color-ink-600)]">Đang chấm…</p>
          )}

          <p className="text-xs text-[var(--color-ink-600)]">
            Hình ảnh từ camera <strong>không rời khỏi máy bạn</strong>. Trình duyệt chỉ gửi lên một dãy
            số mô tả chuyển động.
          </p>
        </section>
      </div>

      {error && <ErrorNotice message={error} />}
      {result && <AttemptFeedback result={result} targetLabel={item.label} />}

      <p className="text-xs text-[var(--color-ink-600)]">{capabilities.data?.attributionText}</p>
    </div>
  );
}

function AttemptFeedback({ result, targetLabel }: { result: AttemptResult; targetLabel: string }) {
  const confidencePercent = result.confidence ? Math.round(result.confidence * 100) : null;

  return (
    <section
      aria-live="polite"
      className={`space-y-4 rounded-xl px-5 py-4 ${
        result.verified
          ? "bg-[var(--color-success-050)]"
          : "bg-[var(--color-danger-050)]"
      }`}
    >
      <h2
        className={`text-lg font-semibold ${
          result.verified ? "text-[var(--color-success-700)]" : "text-[var(--color-danger-700)]"
        }`}
      >
        <span aria-hidden="true">{result.verified ? "✓ " : "✗ "}</span>
        {result.verified ? "Chính xác!" : "Chưa đúng"}
      </h2>

      {confidencePercent !== null && (
        <div className="space-y-1">
          <p className="text-sm text-[var(--color-ink-600)]">Độ tin cậy: {confidencePercent}%</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border-default)]">
            <div
              className="h-full bg-[var(--color-brand-600)]"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Top-3 chỉ hiện khi nó dạy được điều gì đó: nhận nhầm ký hiệu khác hoặc phân vân. */}
      {result.top3 && result.top3.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium">Hệ thống thấy:</p>
          <ul className="space-y-1 text-sm">
            {result.top3.map((prediction) => (
              <li key={prediction.label} className="flex justify-between gap-4">
                <span>{prediction.label}</span>
                <span className="text-[var(--color-ink-600)]">
                  {Math.round(prediction.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-ink-600)]">Bạn đang luyện: {targetLabel}</p>
        </div>
      )}

      {result.qualityHints.length > 0 && (
        <ul className="space-y-1 text-sm">
          {result.qualityHints.map((hint) => (
            <li key={hint}>💡 {hint}</li>
          ))}
        </ul>
      )}

      {/* Sau 3 lần liên tiếp chưa đạt, chủ động mở lối thoát thay vì để người học mắc kẹt (BR-A122). */}
      {result.consecutiveFailures >= 3 && (
        <p className="rounded-lg bg-[var(--color-bg-subtle)] px-3 py-2 text-sm">
          Ký hiệu này hơi khó. Bạn có thể xem lại video mẫu ở tốc độ chậm, hoặc bỏ qua và quay lại sau
          — tiến độ của bạn không bị ảnh hưởng.
        </p>
      )}

      <p className="text-xs text-[var(--color-ink-600)]">
        {result.countedAgainstQuota
          ? result.quotaRemaining != null
            ? `Còn ${result.quotaRemaining} lượt luyện AI hôm nay.`
            : "Bạn đang dùng gói không giới hạn."
          : "Lượt này không tính vào hạn mức."}
      </p>
    </section>
  );
}
