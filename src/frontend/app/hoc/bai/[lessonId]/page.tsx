"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { PlaceholderVideo } from "@/components/PlaceholderVideo";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <Link href="/hoc" className="text-sm text-[var(--color-ink-600)] underline">
          ← {lesson.data.title}
        </Link>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border-default)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={exercises.length}
          aria-valuenow={index}
          aria-label="Tiến độ bài học"
        >
          <div
            className="h-full bg-[var(--color-brand-600)]"
            style={{ width: `${(index / exercises.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[var(--color-ink-600)]">
          Câu {index + 1} / {exercises.length}
        </p>
      </header>

      {exercise.placeholderVideo || !exercise.videoUrl ? (
        <PlaceholderVideo label="Video ký hiệu mẫu" />
      ) : (
        <video
          key={exercise.id}
          src={exercise.videoUrl}
          controls
          playsInline
          className="aspect-video w-full rounded-xl bg-[var(--color-bg-video)]"
        />
      )}

      <h1 className="text-xl font-semibold">{exercise.promptText}</h1>

      {isTypedExercise ? (
        <div className="space-y-1">
          <label htmlFor="typed" className="block text-sm font-medium">
            Câu trả lời của bạn
          </label>
          <input
            id="typed"
            value={typedAnswer}
            disabled={Boolean(feedback)}
            onChange={(event) => setTypedAnswer(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
          />
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
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
          className={`space-y-2 rounded-lg px-4 py-3 ${
            feedback.isCorrect
              ? "bg-[var(--color-success-050)] text-[var(--color-success-700)]"
              : "bg-[var(--color-danger-050)] text-[var(--color-danger-700)]"
          }`}
        >
          <p className="font-semibold">
            <span aria-hidden="true">{feedback.isCorrect ? "✓ " : "✗ "}</span>
            {feedback.isCorrect ? "Chính xác!" : "Chưa đúng"}
          </p>
          {!feedback.isCorrect && feedback.correctAnswerText && (
            <p className="text-sm">Đáp án đúng: {feedback.correctAnswerText}</p>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            className="rounded-lg bg-[var(--color-brand-600)] px-5 py-2 font-medium text-white hover:bg-[var(--color-brand-700)]"
          >
            {index + 1 < exercises.length ? "Câu tiếp theo" : "Hoàn thành bài học"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={submitAnswer}
          disabled={!canSubmit || busy}
          className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-3 font-medium text-white hover:bg-[var(--color-brand-700)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-default)] disabled:text-[var(--color-ink-400)]"
        >
          {busy ? "Đang kiểm tra…" : "Kiểm tra"}
        </button>
      )}
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

  let tone = "border-[var(--color-border-default)]";
  let marker = "";
  if (isRevealedCorrect) {
    tone = "border-[var(--color-success-700)] bg-[var(--color-success-050)]";
    marker = "✓ ";
  } else if (isWrongChoice) {
    tone = "border-[var(--color-danger-700)] bg-[var(--color-danger-050)]";
    marker = "✗ ";
  } else if (selected) {
    tone = "border-[var(--color-brand-600)] bg-[var(--color-brand-050)]";
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      disabled={Boolean(feedback)}
      className={`w-full rounded-lg border-2 px-4 py-3 text-left ${tone}`}
    >
      <span aria-hidden="true">{marker}</span>
      {option.labelText}
    </button>
  );
}

function LessonSummary({ summary, title }: { summary: CompleteResult; title: string }) {
  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <h1 className="text-2xl font-bold">Hoàn thành: {title}</h1>
      <p className="text-5xl font-bold text-[var(--color-brand-600)]">{summary.scorePercent}%</p>
      <dl className="grid grid-cols-2 gap-3 text-left text-sm">
        <Stat label="Chuỗi ngày học" value={`${summary.streak.current} ngày`} />
        <Stat label="Dài nhất" value={`${summary.streak.longest} ngày`} />
        <Stat label="Thời gian học" value={`${summary.effectiveMinutes} phút`} />
        <Stat label="Ký hiệu mới" value={`${summary.newSignsLearned}`} />
      </dl>
      <div className="flex flex-col gap-2">
        {summary.nextLessonId && (
          <Link
            href={`/hoc/bai/${summary.nextLessonId}`}
            className="rounded-lg bg-[var(--color-brand-600)] px-5 py-3 font-medium text-white"
          >
            Học bài tiếp theo
          </Link>
        )}
        <Link
          href="/luyen-ai"
          className="rounded-lg border border-[var(--color-border-strong)] px-5 py-3 font-medium"
        >
          Luyện ký hiệu với AI
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border-default)] px-3 py-2">
      <dt className="text-xs text-[var(--color-ink-600)]">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
