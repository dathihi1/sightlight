"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mascot } from "@/components/ui/Mascot";
import { Confetti, CountUp } from "@/components/ui/Celebrate";
import { IconCheck, IconFlame, IconStar } from "@/components/ui/Icons";
import { LessonIntro } from "@/components/lesson/LessonIntro";
import { ExerciseHeader } from "@/components/lesson/ExerciseHeader";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { ApiError, apiCall } from "@/lib/api";
import { LessonResult, AnswerResult, CompleteResult, MatchPair } from "@/lib/lesson-types";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

/** Lời khen / động viên luân phiên theo số câu đã làm — thay đổi để phản hồi không nhàm. */
const PRAISE = ["Chính xác!", "Tuyệt vời!", "Làm tốt lắm!", "Quá chuẩn!", "Xuất sắc!"];
const ENCOURAGE = ["Chưa đúng", "Chưa đúng rồi", "Chưa chính xác"];

/** Thanh trên cùng khi làm bài: nút thoát + thanh tiến độ tổng. */
function LessonTopBar({ percent }: { percent: number }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl items-center gap-4 px-4 pt-6">
      <Link
        href="/hoc"
        aria-label="Thoát bài học, quay lại lộ trình"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl font-bold text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      >
        ✕
      </Link>
      <div
        className="progress flex-1"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ bài học"
      >
        <span className="transition-[width] duration-500" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}

/** Thanh hành động dính đáy, nền trung tính — kết quả đúng/sai hiện trong nội dung, không tô màu cả thanh. */
function ActionFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-40 mt-10 border-t border-ink-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl justify-end px-4 py-4">
        <div className="w-full sm:w-56">{children}</div>
      </div>
    </div>
  );
}

/**
 * Lesson page mới với hỗ trợ:
 * - Lesson metadata (summary, topic, level)
 * - Content blocks (intro, SIGN_CARD với video teaching)
 * - Exercise types: SIGN_TO_MEANING, MEANING_TO_SIGN, TYPE_WHAT_YOU_SEE, SIGN_VIDEO_RECALL, SENTENCE_ORDER, MATCH_SIGN_MEANING
 */
export default function NewLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params.lessonId;

  const lesson = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiCall<LessonResult>(`/api/v1/lessons/${lessonId}`),
  });

  const [showIntro, setShowIntro] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<CompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Số câu đúng liên tiếp (combo) và bộ đếm để phát lại hiệu ứng mỗi lần trả lời.
  const [combo, setCombo] = useState(0);
  const [answered, setAnswered] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Sau mỗi lần chấm, đưa thẻ phản hồi vào tầm nhìn (tránh bị thanh nút dưới che mất).
  useEffect(() => {
    if (answered > 0) feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [answered]);

  if (lesson.isLoading) {
    return <EmptyState title="Đang tải bài học…" mood="wow" />;
  }

  if (lesson.isError || !lesson.data) {
    const message = lesson.error instanceof ApiError ? lesson.error.errorMessage : "Không tải được bài học.";
    return (
      <EmptyState title="Không mở được bài học" body={message} mood="sad">
        <Link href="/hoc" className="btn btn-primary">
          Quay lại lộ trình
        </Link>
      </EmptyState>
    );
  }

  const exercises = lesson.data.exercises;
  const blocks = lesson.data.blocks || [];
  const hasIntro = blocks.some((b) => b.blockType === "INTRO");
  const signCards = blocks.filter((b) => b.blockType === "SIGN_CARD");
  const totalSteps = signCards.length + (exercises?.length ?? 0) || 1;

  if (showIntro && hasIntro) {
    return (
      <LessonIntro
        title={lesson.data.title}
        summary={lesson.data.summary}
        topic={lesson.data.topic}
        targetLevel={lesson.data.targetLevel}
        estimatedMinutes={lesson.data.estimatedMinutes}
        learningObjectives={lesson.data.learningObjectives}
        blocks={lesson.data.blocks}
        onStart={() => {
          setShowIntro(false);
          if (signCards.length > 0) setCurrentBlockIndex(0);
        }}
      />
    );
  }

  // Thẻ ký hiệu mới — dạy trước khi làm bài tập
  if (currentBlockIndex < signCards.length) {
    const card = signCards[currentBlockIndex];
    const isLast = currentBlockIndex === signCards.length - 1;

    return (
      <div className="flex min-h-screen flex-col">
        <LessonTopBar percent={Math.round((currentBlockIndex / totalSteps) * 100)} />

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-8">
          <span className="chip bg-grape-100 text-grape-700">
            Ký hiệu mới · {currentBlockIndex + 1}/{signCards.length}
          </span>
          {card.title && <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">{card.title}</h1>}

          <div className="mt-6">
            {card.mediaRef ? (
              <SignVideoPlayer videoUrl={card.mediaRef} title={card.title || undefined} autoPlay={true} loop={true} />
            ) : (
              <div className="grid aspect-video place-items-center rounded-3xl border border-ink-200 bg-ink-50 text-base font-bold text-ink-500">
                Đang tải video mẫu…
              </div>
            )}
          </div>

          {card.bodyText && (
            <div className="mt-5 flex items-center gap-4 rounded-3xl border border-ink-200 bg-white px-5 py-4">
              <Mascot className="w-14 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-ink-500">Nghĩa là</p>
                <p className="text-xl font-bold text-ink-900">{card.bodyText}</p>
              </div>
            </div>
          )}

          <p className="mt-6 text-base text-ink-600">
            Mẹo: chú ý hình dạng bàn tay, hướng lòng bàn tay và biểu cảm khuôn mặt.
          </p>
        </main>

        <ActionFooter>
          <div className="flex gap-3">
            {currentBlockIndex > 0 && (
              <button type="button" onClick={() => setCurrentBlockIndex(currentBlockIndex - 1)} className="btn btn-secondary" aria-label="Ký hiệu trước">
                ←
              </button>
            )}
            <button type="button" onClick={() => setCurrentBlockIndex(currentBlockIndex + 1)} className="btn btn-primary flex-1">
              {isLast ? "Luyện tập" : "Tiếp tục"}
            </button>
          </div>
        </ActionFooter>
      </div>
    );
  }

  // Màn tổng kết
  if (summary) {
    const stats = [
      {
        label: "XP",
        value: <CountUp to={summary.earnedExp} prefix="+" />,
        icon: <IconStar className="h-6 w-6" />,
        tone: "border-sun-300 bg-sun-50 text-sun-700",
      },
      {
        label: "Chính xác",
        value: <CountUp to={summary.scorePercent} suffix="%" />,
        icon: <IconCheck className="h-6 w-6" />,
        tone: "border-success-200 bg-success-50 text-success-700",
      },
      {
        label: "Chuỗi ngày",
        value: <CountUp to={summary.streak.current} />,
        icon: <IconFlame className="h-6 w-6" />,
        tone: "border-flame-300 bg-flame-50 text-flame-700",
      },
    ];
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 text-center">
        <Confetti mode="rain" />
        <div className="animate-pop-in">
          <Mascot className="w-32" mood={summary.firstTryPerfect ? "wow" : "happy"} wave />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-sun-700">
          {summary.firstTryPerfect ? "Hoàn hảo!" : "Hoàn thành bài học!"}
        </h1>
        <p className="mt-2 text-lg font-bold text-ink-600">
          {summary.newSignsLearned} ký hiệu mới · {summary.effectiveMinutes} phút
        </p>

        <ul className="mt-8 grid w-full grid-cols-3 gap-3">
          {stats.map((s) => (
            <li key={s.label} className={`rounded-2xl border px-2 pb-4 pt-3 ${s.tone}`}>
              <p className="text-xs font-bold">{s.label}</p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-2xl font-bold">
                {s.icon}
                {s.value}
              </p>
            </li>
          ))}
        </ul>

        {summary.streak.goalMetToday && (
          <p className="mt-6 flex items-center gap-2 text-base font-semibold text-success-700">
            <IconCheck className="h-5 w-5" /> Đã đạt mục tiêu hôm nay
          </p>
        )}
        <p className="mt-2 text-sm font-bold text-ink-500">Chuỗi dài nhất: {summary.streak.longest} ngày</p>

        <div className="mt-10 w-full">
          {summary.nextLessonId ? (
            <button onClick={() => router.push(`/hoc/bai-moi/${summary.nextLessonId}`)} className="btn btn-primary btn-lg w-full">
              Bài tiếp theo
            </button>
          ) : (
            <Link href="/hoc" className="btn btn-primary btn-lg w-full">
              Về lộ trình
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <EmptyState title="Bài học chưa có bài tập" body="Nội dung đang được bổ sung." mood="sad">
        <Link href="/hoc" className="btn btn-primary">
          Quay lại lộ trình
        </Link>
      </EmptyState>
    );
  }

  const exercise = exercises[index];

  const handleSubmit = async () => {
    if (busy) return;

    if ((exercise.type === "SIGN_TO_MEANING" || exercise.type === "MEANING_TO_SIGN") && !selectedOptionId) {
      setError("Chọn một đáp án để kiểm tra.");
      return;
    }
    if ((exercise.type === "TYPE_WHAT_YOU_SEE" || exercise.type === "SIGN_VIDEO_RECALL") && !typedAnswer.trim()) {
      setError("Nhập câu trả lời để kiểm tra.");
      return;
    }
    if (exercise.type === "SENTENCE_ORDER" && orderedTokens.length === 0) {
      setError("Chạm vào các từ để sắp xếp câu.");
      return;
    }
    if (exercise.type === "MATCH_SIGN_MEANING" && matches.length === 0) {
      setError("Ghép ít nhất một cặp ký hiệu – ý nghĩa.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await apiCall<AnswerResult>(`/api/v1/lessons/${lessonId}/exercises/${exercise.id}/answer`, {
        method: "POST",
        body: {
          answerType: exercise.type,
          selectedOptionId: selectedOptionId ?? undefined,
          typedAnswer: typedAnswer.trim() || undefined,
          orderedTokens: orderedTokens.length > 0 ? orderedTokens : undefined,
          matches: matches.length > 0 ? matches : undefined,
        },
      });
      setFeedback(result);
      setCombo((c) => (result.isCorrect ? c + 1 : 0));
      setAnswered((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.errorMessage : "Không gửi được câu trả lời. Thử lại nhé.");
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = () => {
    if (index < exercises.length - 1) {
      setIndex(index + 1);
      setSelectedOptionId(null);
      setTypedAnswer("");
      setOrderedTokens([]);
      setMatches([]);
      setFeedback(null);
      setError(null);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    setBusy(true);
    try {
      const result = await apiCall<CompleteResult>(`/api/v1/lessons/${lessonId}/complete`, {
        method: "POST",
        body: { idempotencyKey: crypto.randomUUID() },
      });
      setSummary(result);
      trackEvent(AnalyticsEvents.LESSON_COMPLETE, {
        lesson_id: lessonId,
        score_percent: result.scorePercent,
        earned_exp: result.earnedExp,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.errorMessage : "Không lưu được kết quả bài học. Thử lại nhé.");
    } finally {
      setBusy(false);
    }
  };

  const done = signCards.length + index + (feedback ? 1 : 0);

  return (
    <div className="flex min-h-screen flex-col">
      <LessonTopBar percent={Math.round((done / totalSteps) * 100)} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-8">
        <ExerciseHeader exercise={exercise} />
        <div className="mt-6">
          <ExerciseRenderer
            exercise={exercise}
            selectedOptionId={selectedOptionId}
            typedAnswer={typedAnswer}
            onSelectOption={setSelectedOptionId}
            onTypeAnswer={setTypedAnswer}
            orderedTokens={orderedTokens}
            onOrderTokens={setOrderedTokens}
            matches={matches}
            onMatches={setMatches}
            disabled={!!feedback || busy}
            feedback={feedback ? { isCorrect: feedback.isCorrect, correctOptionId: feedback.correctOptionId } : null}
          />
        </div>

        {/* Phản hồi hiện ngay dưới câu hỏi — luôn có icon + chữ, không chỉ dựa vào màu */}
        <div aria-live="polite" ref={feedbackRef}>
          {feedback && (
            <div
              key={answered}
              className={`relative mt-6 flex items-start gap-4 rounded-2xl border p-5 ${
                feedback.isCorrect ? "animate-pop-in border-success-200 bg-success-50" : "animate-shake border-danger-200 bg-danger-50"
              }`}
            >
              {feedback.isCorrect && <Confetti />}
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${
                  feedback.isCorrect ? "bg-success-600" : "bg-danger-600"
                }`}
              >
                {feedback.isCorrect ? (
                  <IconCheck className="h-5 w-5" />
                ) : (
                  <span className="text-lg font-bold" aria-hidden="true">
                    ✕
                  </span>
                )}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-lg font-bold ${feedback.isCorrect ? "text-success-700" : "text-danger-700"}`}>
                    {feedback.isCorrect ? PRAISE[answered % PRAISE.length] : ENCOURAGE[answered % ENCOURAGE.length]}
                  </p>
                  {feedback.isCorrect && combo >= 2 && (
                    <span className="chip animate-pop-in bg-flame-100 text-flame-700">
                      <IconFlame className="h-4 w-4" /> {combo} câu đúng liên tiếp
                    </span>
                  )}
                </div>
                {!feedback.isCorrect && feedback.correctAnswerText && (
                  <p className="text-base text-ink-800">
                    Đáp án đúng: <strong className="font-semibold">{feedback.correctAnswerText}</strong>
                  </p>
                )}
                {!feedback.isCorrect && feedback.willRepeat && (
                  <p className="text-sm text-ink-600">Câu này sẽ quay lại để bạn thử lần nữa.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6">
            <ErrorNotice message={error} />
          </div>
        )}
      </main>

      <ActionFooter>
        {feedback ? (
          <button onClick={handleContinue} disabled={busy} className="btn btn-primary w-full">
            {index < exercises.length - 1 ? "Câu tiếp theo" : "Hoàn thành"}
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={busy} className="btn btn-primary w-full">
            {busy ? "Đang kiểm tra…" : "Kiểm tra"}
          </button>
        )}
      </ActionFooter>
    </div>
  );
}
