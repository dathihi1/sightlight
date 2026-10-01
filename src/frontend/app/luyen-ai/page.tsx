"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Confetti } from "@/components/ui/Celebrate";
import { Mascot } from "@/components/ui/Mascot";
import { IconCheck, IconShield } from "@/components/ui/Icons";
import { ApiError, apiCall } from "@/lib/api";
import { RewardedAdModal } from "@/components/RewardedAdModal";
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
      fallback={<EmptyState title="Đang tải phòng luyện…" mood="wow" />}
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
  const [videoRatio, setVideoRatio] = useState<number>(16 / 9);
  const [showAdModal, setShowAdModal] = useState(false);

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
    const needsLogin = capabilities.error instanceof ApiError && capabilities.error.httpStatus === 401;
    return needsLogin ? (
      <EmptyState title="Đăng nhập để luyện với AI" body="AI chấm từng cử chỉ của bạn qua camera — video không rời khỏi máy.">
        <Link href="/dang-nhap?next=/luyen-ai" className="btn btn-primary">
          Đăng nhập
        </Link>
        <Link href="/dang-ky" className="btn btn-secondary">
          Tạo tài khoản
        </Link>
      </EmptyState>
    ) : (
      <EmptyState title="AI đang nghỉ một chút" body="Hệ thống chấm tự động chưa sẵn sàng. Thử lại sau vài phút nhé." mood="sad" />
    );
  }

  if (capabilities.isLoading || session.isLoading) {
    return <EmptyState title="Đang chuẩn bị phiên luyện…" mood="wow" />;
  }

  if (!item) {
    return <EmptyState title="Chưa có ký hiệu để luyện" body="Phiên này chưa có ký hiệu nào được hỗ trợ chấm tự động." mood="sad" />;
  }

  const total = session.data?.items.length ?? 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-grape-600">
            Luyện camera · {itemIndex + 1}/{total}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Làm ký hiệu “<span className="text-brand-500">{item.label}</span>”
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setItemIndex((current) => Math.min(current + 1, total - 1));
            setResult(null);
          }}
          disabled={itemIndex >= total - 1}
          className="btn btn-secondary btn-sm self-start sm:self-auto"
        >
          Bỏ qua
        </button>
      </header>

      {capabilities.data?.stubMode && (
        // Không để ai nhầm kết quả giả lập với độ chính xác thật của mô hình.
        <p className="mt-4 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-sm font-bold text-sun-800">
          AI đang chạy ở chế độ mô phỏng (chưa nạp trọng số mô hình). Kết quả chỉ minh hoạ luồng, không phản ánh độ
          chính xác thật.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden p-3" aria-labelledby="demo-title">
          <div className="flex items-center justify-between px-2 pb-3 pt-1">
            <h2 id="demo-title" className="text-sm font-bold text-sky-700">
              Video mẫu
            </h2>
          </div>
          <SignVideoPlayer
            key={item.signId}
            videoUrl={item.videoUrl}
            placeholderVideo={item.placeholderVideo}
            title={`Video mẫu — ${item.label}`}
            onRatioChange={setVideoRatio}
          />
        </section>

        <section className="card overflow-hidden p-3" aria-labelledby="cam-title">
          <div className="flex items-center justify-between px-2 pb-3 pt-1">
            <h2 id="cam-title" className="text-sm font-bold text-grape-600">
              Camera của bạn
            </h2>
            {phase === "recording" && (
              <span className="chip bg-danger-50 text-danger-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-danger-500" aria-hidden="true" />
                {/* Đồng hồ đếm để người học biết nhịp độ mong đợi (~2 giây) — BR-A120. */}
                Đang ghi {(elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div
            className={`relative mx-auto w-full overflow-hidden rounded-3xl bg-ink-950 ring-4 transition-all ${
              phase === "recording"
                ? "ring-danger-400"
                : result
                  ? result.verified
                    ? "ring-success-400"
                    : "ring-danger-300"
                  : "ring-transparent"
            }`}
            style={{ aspectRatio: videoRatio, maxHeight: "70vh" }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full scale-x-[-1] rounded-3xl object-cover"
            />
            {phase === "idle" && (
              <div className="absolute inset-0 grid place-items-center">
                <Mascot className="w-24" mood="wow" />
              </div>
            )}
          </div>

          <div className="px-2 pb-2 pt-4">
            {phase === "idle" && (
              <button type="button" onClick={startCamera} className="btn btn-grape w-full">
                Bật camera
              </button>
            )}
            {phase === "loading-model" && (
              <p className="btn btn-secondary w-full cursor-wait" role="status">
                Đang nạp mô hình…
              </p>
            )}
            {phase === "ready" && (
              <button type="button" onClick={startRecording} className="btn btn-primary w-full">
                Bắt đầu ký hiệu
              </button>
            )}
            {phase === "recording" && (
              <button type="button" onClick={finishRecording} className="btn btn-danger w-full">
                Xong
              </button>
            )}
            {phase === "scoring" && (
              <p className="btn btn-secondary w-full cursor-wait" role="status">
                Đang chấm…
              </p>
            )}
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-600">
              <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <span>
                Hình ảnh <strong className="font-bold text-ink-800">không rời khỏi máy bạn</strong> — trình duyệt chỉ
                gửi một dãy số mô tả chuyển động.
              </span>
            </p>

            {/* Banner xem video quảng cáo nhận lượt AI */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-xl text-amber-700">
                  🎁
                </span>
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Cần thêm lượt luyện Camera AI?
                  </p>
                  <p className="text-xs text-amber-800">
                    Xem video ngắn 15s để nhận ngay +1 lượt luyện tập hoàn toàn miễn phí.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdModal(true)}
                className="btn btn-primary btn-sm whitespace-nowrap bg-amber-600 hover:bg-amber-700 border-none text-white self-stretch sm:self-auto cursor-pointer"
              >
                Xem video (+1 lượt)
              </button>
            </div>
          </div>
        </section>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorNotice message={error} />
        </div>
      )}
      {result && <AttemptFeedback result={result} targetLabel={item.label} onOpenAd={() => setShowAdModal(true)} />}

      <div className="mt-8 space-y-1 text-sm text-ink-600">
        {capabilities.data?.disclaimerText && <p>{capabilities.data.disclaimerText}</p>}
        {capabilities.data?.attributionText && <p>{capabilities.data.attributionText}</p>}
      </div>

      <RewardedAdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        rewardType="AI_QUOTA"
        placement="CAMERA_PAGE"
      />
    </div>
  );
}

function AttemptFeedback({
  result,
  targetLabel,
  onOpenAd,
}: {
  result: AttemptResult;
  targetLabel: string;
  onOpenAd?: () => void;
}) {
  const confidencePercent = result.confidence ? Math.round(result.confidence * 100) : null;
  const ok = result.verified;

  return (
    <section
      aria-live="polite"
      className={`relative mt-6 rounded-3xl border p-6 ${ok ? "animate-pop-in border-success-200 bg-success-50" : "animate-shake border-danger-200 bg-danger-50"}`}
    >
      {ok && <Confetti />}
      <div className="flex items-center gap-4">
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-white ${
            ok ? "bg-success-600" : "bg-danger-600"
          }`}
        >
          {ok ? (
            <IconCheck className="h-7 w-7" />
          ) : (
            <span className="text-2xl font-bold" aria-hidden="true">
              ✕
            </span>
          )}
        </span>
        <div className="flex-1">
          <h2 className={`text-2xl font-bold ${ok ? "text-success-700" : "text-danger-700"}`}>
            {ok ? "Chính xác!" : "Chưa đúng rồi"}
          </h2>
          {confidencePercent !== null && (
            <div className="mt-2 flex items-center gap-3">
              <div className="progress h-3 flex-1 bg-white">
                <span className={ok ? "" : "!bg-danger-400"} style={{ width: `${confidencePercent}%` }} />
              </div>
              <span className="text-sm font-bold text-ink-700">Độ tin cậy {confidencePercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Top-3 chỉ hiện khi nó dạy được điều gì đó: nhận nhầm ký hiệu khác hoặc phân vân. */}
      {result.top3 && result.top3.length > 0 && (
        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="text-sm font-bold text-ink-500">AI nhận ra</p>
          <ul className="mt-2 space-y-1.5">
            {result.top3.map((prediction) => (
              <li
                key={prediction.label}
                className={`flex justify-between gap-4 text-base font-bold ${
                  prediction.label === targetLabel ? "text-brand-600" : "text-ink-700"
                }`}
              >
                <span>{prediction.label}</span>
                <span>{Math.round(prediction.confidence * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-600">Bạn đang luyện: {targetLabel}</p>
        </div>
      )}

      {result.qualityHints.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.qualityHints.map((hint) => (
            <li key={hint} className="flex items-start gap-2 text-base font-bold text-sun-800">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun-400 text-xs font-bold text-ink-900"
                aria-hidden="true"
              >
                !
              </span>
              {hint}
            </li>
          ))}
        </ul>
      )}

      {/* Sau 3 lần liên tiếp chưa đạt, chủ động mở lối thoát thay vì để người học mắc kẹt (BR-A122). */}
      {result.consecutiveFailures >= 3 && (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-base text-ink-700">
          Ký hiệu này hơi khó. Xem lại video mẫu ở tốc độ chậm, hoặc bỏ qua và quay lại sau — tiến độ của bạn không
          bị ảnh hưởng.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-ink-600">
        <p>
          {result.countedAgainstQuota
            ? result.quotaRemaining != null
              ? `Còn ${result.quotaRemaining} lượt luyện AI hôm nay.`
              : "Bạn đang dùng gói không giới hạn."
            : "Lượt này không tính vào hạn mức."}
        </p>

        {onOpenAd && (
          <button
            type="button"
            onClick={onOpenAd}
            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition inline-flex items-center gap-1 cursor-pointer"
          >
            <span>🎁</span>
            <span>Xem video nhận thêm +1 lượt</span>
          </button>
        )}
      </div>
    </section>
  );
}
