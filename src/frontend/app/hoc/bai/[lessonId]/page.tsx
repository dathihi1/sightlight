"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { ApiError, apiCall } from "@/lib/api";

interface LessonResult {
  lessonId: string;
  title: string;
  type: string;
  resumeAtIndex: number;
  exercises: ExerciseNode[];
}

interface ExerciseNode {
  id: string;
  type: string;
  promptText: string | null;
  videoUrl: string | null;
  placeholderVideo: boolean;
  options: OptionNode[] | null;
  tokens: string[] | null;
}

interface OptionNode {
  id: string;
  labelText: string;
  videoUrl: string | null;
}

interface AnswerResult {
  isCorrect: boolean;
  attemptNo: number;
  correctOptionId: string | null;
  correctAnswerText: string | null;
  willRepeat: boolean;
}

interface CompleteResult {
  scorePercent: number;
  firstTryPerfect: boolean;
  effectiveMinutes: number;
  streak: { current: number; longest: number; freezeCount: number; goalMetToday: boolean };
  newSignsLearned: number;
  nextLessonId: string | null;
}

/** SCR-10 — trình học bài (FR-11, FR-12). Chấm điểm nằm ở server, trang này chỉ hiển thị. */
export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params.lessonId;

  const lesson = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiCall<LessonResult>(`/api/v1/lessons/${lessonId}`),
  });

  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<CompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (lesson.data) setIndex(lesson.data.resumeAtIndex);
  }, [lesson.data]);

  if (lesson.isLoading) return <p className="text-[var(--color-ink-600)]">Đang tải bài học…</p>;

  if (lesson.isError || !lesson.data) {
    const message =
      lesson.error instanceof ApiError ? lesson.error.errorMessage : "Không tải được bài học.";
    return (
      <div className="space-y-4">
        <ErrorNotice message={message} />
        <Link href="/hoc" className="text-[var(--color-brand-600)] underline">
          Quay lại lộ trình
        </Link>
      </div>
    );
  }

  const exercises = lesson.data.exercises;
  const exercise = exercises[Math.min(index, exercises.length - 1)];

  if (summary) {
    return <LessonSummary summary={summary} title={lesson.data.title} />;
  }

  if (!exercise) {
    return <ErrorNotice message="Bài học này chưa có bài tập nào." />;
  }

  const isTypedExercise = exercise.type === "TYPE_WHAT_YOU_SEE";

  async function submitAnswer() {
    setError(null);
    setBusy(true);
    try {
      const result = await apiCall<AnswerResult>(
        `/api/v1/lessons/${lessonId}/exercises/${exercise.id}/answer`,
        {
          method: "POST",
          body: {
            answerType: exercise.type,
            selectedOptionId: isTypedExercise ? null : selectedOptionId,
            typedAnswer: isTypedExercise ? typedAnswer : null,
            clientElapsedMs: Date.now() - startedAt.current,
          },
        },
      );
      setFeedback(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không gửi được câu trả lời.");
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    setFeedback(null);
    setSelectedOptionId(null);
    setTypedAnswer("");

    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      return;
    }

    setBusy(true);
    try {
      const result = await apiCall<CompleteResult>(`/api/v1/lessons/${lessonId}/complete`, {
        method: "POST",
        body: {
          idempotencyKey: crypto.randomUUID(),
          activeSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        },
      });
      setSummary(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không ghi nhận được kết quả.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = isTypedExercise ? typedAnswer.trim().length > 0 : Boolean(selectedOptionId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
        <header className="space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/hoc" className="text-sm font-bold text-[#64748B] hover:text-[#0d9fa5] flex items-center gap-1 transition-colors">
              <span>←</span>
              <span>{lesson.data.title}</span>
            </Link>
            <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-1 rounded-full border border-[#b2e7e9]">
              Câu {index + 1} / {exercises.length}
            </span>
          </div>

          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-[#E2DBD0]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={exercises.length}
            aria-valuenow={index}
            aria-label="Tiến độ bài học"
          >
            <div
              className="h-full bg-[#0d9fa5] rounded-full transition-all duration-300"
              style={{ width: `${(index / exercises.length) * 100}%` }}
            />
          </div>
        </header>

        <SignVideoPlayer
          key={exercise.id}
          videoUrl={exercise.videoUrl}
          placeholderVideo={exercise.placeholderVideo}
          title={exercise.promptText || "Video ký hiệu mẫu"}
          className="border border-[#E2DBD0]"
        />

        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">{exercise.promptText}</h1>

        {isTypedExercise ? (
          <div className="space-y-2">
            <label htmlFor="typed" className="block text-sm font-bold text-[#0F172A]">
              Câu trả lời của bạn
            </label>
            <input
              id="typed"
              value={typedAnswer}
              disabled={Boolean(feedback)}
              onChange={(event) => setTypedAnswer(event.target.value)}
              placeholder="Nhập nghĩa ký hiệu VSL…"
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(exercise.options ?? []).map((option) => (
              <li key={option.id}>
                <OptionCard
                  option={option}
                  selected={selectedOptionId === option.id}
                  feedback={feedback}
                  onSelect={() => !feedback && setSelectedOptionId(option.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {error && <ErrorNotice message={error} />}

        {feedback ? (
          <div
            className={`space-y-3 rounded-2xl p-5 border transition-all ${
              feedback.isCorrect
                ? "bg-[#e6f7f8] border-[#b2e7e9] text-[#08757a]"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="font-extrabold text-base flex items-center gap-2">
              <span className="text-lg">{feedback.isCorrect ? "✓" : "✗"}</span>
              <span>{feedback.isCorrect ? "Chính xác tuyệt vời!" : "Chưa chính xác"}</span>
            </p>
            {!feedback.isCorrect && feedback.correctAnswerText && (
              <p className="text-sm font-medium">Đáp án đúng: <span className="font-bold">{feedback.correctAnswerText}</span></p>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={busy}
              className="rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-3 font-bold text-white shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              {index + 1 < exercises.length ? "Câu tiếp theo →" : "Hoàn thành bài học 🎉"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={submitAnswer}
            disabled={!canSubmit || busy}
            className="w-full rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-3.5 font-bold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-[#E2DBD0] disabled:text-[#94A3B8] cursor-pointer"
          >
            {busy ? "Đang kiểm tra…" : "Kiểm tra đáp án"}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  option,
  selected,
  feedback,
  onSelect,
}: {
  option: OptionNode;
  selected: boolean;
  feedback: AnswerResult | null;
  onSelect: () => void;
}) {
  const isRevealedCorrect = feedback && feedback.correctOptionId === option.id;
  const isWrongChoice = feedback && selected && !feedback.isCorrect;

  let tone = "border-[#E2DBD0] bg-[#F4EFE6]/50 hover:border-[#0d9fa5] hover:bg-white";
  let marker = "";
  if (isRevealedCorrect) {
    tone = "border-[#0d9fa5] bg-[#e6f7f8] text-[#08757a] ring-1 ring-[#0d9fa5]";
    marker = "✓ ";
  } else if (isWrongChoice) {
    tone = "border-red-400 bg-red-50 text-red-700";
    marker = "✗ ";
  } else if (selected) {
    tone = "border-[#0d9fa5] bg-[#e6f7f8] text-[#08757a] ring-2 ring-[#0d9fa5]";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      disabled={Boolean(feedback)}
      className={`w-full rounded-2xl border-2 px-4 py-3.5 text-left font-bold text-sm sm:text-base transition-all cursor-pointer ${tone}`}
    >
      <span aria-hidden="true" className="font-extrabold">{marker}</span>
      {option.labelText}
    </button>
  );
}

function LessonSummary({ summary, title }: { summary: CompleteResult; title: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-6 text-center">
        <span className="text-4xl block">🎉</span>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">Hoàn thành: {title}</h1>
        <p className="text-6xl font-extrabold text-[#0d9fa5] tracking-tight">{summary.scorePercent}%</p>
        <dl className="grid grid-cols-2 gap-3 text-left text-sm">
          <Stat label="Chuỗi ngày học" value={`${summary.streak.current} ngày`} />
          <Stat label="Dài nhất" value={`${summary.streak.longest} ngày`} />
          <Stat label="Thời gian học" value={`${summary.effectiveMinutes} phút`} />
          <Stat label="Ký hiệu mới" value={`${summary.newSignsLearned}`} />
        </dl>
        <div className="flex flex-col gap-3 pt-2">
          {summary.nextLessonId && (
            <Link
              href={`/hoc/bai/${summary.nextLessonId}`}
              className="rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-3.5 font-bold text-white shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              Học bài tiếp theo →
            </Link>
          )}
          <Link
            href="/luyen-ai"
            className="rounded-full border border-[#E2DBD0] bg-[#F4EFE6] hover:bg-white px-6 py-3 font-bold text-[#0F172A] transition-colors"
          >
            Luyện tập Camera 📹
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E2DBD0] bg-[#F4EFE6]/50 px-3.5 py-2.5">
      <dt className="text-xs font-medium text-[#64748B]">{label}</dt>
      <dd className="font-bold text-[#0F172A] text-base mt-0.5">{value}</dd>
    </div>
  );
}
