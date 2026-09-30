"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { LessonIntro } from "@/components/lesson/LessonIntro";
import { ExerciseHeader } from "@/components/lesson/ExerciseHeader";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { ApiError, apiCall } from "@/lib/api";
import { LessonResult, AnswerResult, CompleteResult, MatchPair } from "@/lib/lesson-types";

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

  // Fetch lesson data
  const lesson = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => apiCall<LessonResult>(`/api/v1/lessons/${lessonId}`),
  });

  // UI state
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

  // Loading state
  if (lesson.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--color-ink-600)]">Đang tải bài học…</p>
      </div>
    );
  }

  // Error state
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
  const blocks = lesson.data.blocks || [];
  const hasIntro = blocks.some(b => b.blockType === "INTRO");
  const signCards = blocks.filter(b => b.blockType === "SIGN_CARD");

  // Show intro if has intro block and not started yet
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
          // Start with SIGN_CARD blocks if available
          if (signCards.length > 0) {
            setCurrentBlockIndex(0);
          }
        }}
      />
    );
  }

  // Show SIGN_CARD blocks before exercises (interleaved teaching)
  if (currentBlockIndex < signCards.length) {
    const card = signCards[currentBlockIndex];
    const progressPercent = Math.round(((currentBlockIndex + 1) / signCards.length) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/hoc" className="text-[var(--color-brand-600)] hover:underline flex items-center gap-1 text-sm font-medium">
            ← Quay lại lộ trình
          </Link>
          <h2 className="text-lg font-bold text-[var(--color-ink-900)] truncate max-w-[60%] text-center">
            {lesson.data.title}
          </h2>
          <div className="text-xs font-semibold text-[var(--color-ink-500)]">
            Học từ mới: {currentBlockIndex + 1}/{signCards.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[var(--color-brand-600)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 bg-white border border-[var(--color-ink-200)] rounded-2xl shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
              <span>📖</span>
              <span>Bước 1: Học từ mới ({currentBlockIndex + 1}/{signCards.length})</span>
            </div>

            {card.title && (
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink-900)] tracking-tight">
                {card.title}
              </h3>
            )}

            {card.bodyText && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-5 py-3.5 max-w-lg mx-auto shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                  Ý nghĩa / Định nghĩa
                </span>
                <p className="text-lg sm:text-xl font-bold text-amber-950">
                  {card.bodyText}
                </p>
              </div>
            )}
          </div>

          {card.mediaRef ? (
            <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-md border border-[var(--color-ink-200)] bg-black">
              <SignVideoPlayer
                videoUrl={card.mediaRef}
                title={card.title || undefined}
                autoPlay={true}
                loop={true}
              />
            </div>
          ) : (
            <div className="max-w-md mx-auto p-8 rounded-2xl bg-stone-100 text-stone-500 text-center text-sm border border-stone-200">
              Đang tải video mẫu ký hiệu...
            </div>
          )}

          <p className="text-xs text-[var(--color-ink-500)] text-center flex items-center justify-center gap-1.5">
            <span>💡</span>
            <span>Quan sát kỹ khẩu hình và hình thái bàn tay trong video trước khi bắt đầu bài tập luyện tập.</span>
          </p>

          <div className="flex items-center gap-3 pt-2">
            {currentBlockIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentBlockIndex(currentBlockIndex - 1)}
                className="px-5 py-3.5 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
              >
                ← Từ trước
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (currentBlockIndex < signCards.length - 1) {
                  setCurrentBlockIndex(currentBlockIndex + 1);
                } else {
                  setCurrentBlockIndex(signCards.length);
                }
              }}
              className="flex-1 py-3.5 px-6 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] active:scale-[0.99] text-white rounded-xl font-bold text-base shadow-sm transition-all text-center"
            >
              {currentBlockIndex < signCards.length - 1
                ? `Tiếp tục học từ tiếp theo (${currentBlockIndex + 2}/${signCards.length}) →`
                : "Đã hiểu! Bắt đầu luyện tập bài tập 🚀"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show summary if completed
  if (summary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-[var(--color-ink-900)]">
            {summary.firstTryPerfect ? "Xuất sắc! 🎉" : "Hoàn thành! ✅"}
          </h1>
          <div className="text-6xl font-bold text-[var(--color-brand-600)]">
            {summary.scorePercent}%
          </div>
          <p className="text-[var(--color-ink-600)]">
            {summary.effectiveMinutes} phút • {summary.newSignsLearned} ký hiệu mới
          </p>
          {summary.earnedExp > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold text-[var(--color-warning-700)]">+{summary.earnedExp} EXP</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border border-[var(--color-ink-200)] rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-600)]">Streak hiện tại</span>
            <span className="font-semibold">{summary.streak.current} ngày</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-600)]">Streak dài nhất</span>
            <span className="font-semibold">{summary.streak.longest} ngày</span>
          </div>
          {summary.streak.goalMetToday && (
            <p className="text-[var(--color-success-600)] text-sm">✓ Đã đạt mục tiêu hôm nay</p>
          )}
        </div>

        <div className="flex gap-3">
          {summary.nextLessonId ? (
            <button
              onClick={() => router.push(`/hoc/bai-moi/${summary.nextLessonId}`)}
              className="flex-1 py-3 bg-[var(--color-brand-600)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-700)]"
            >
              Bài tiếp theo
            </button>
          ) : (
            <Link
              href="/hoc"
              className="flex-1 py-3 bg-[var(--color-brand-600)] text-white rounded-lg font-medium text-center hover:bg-[var(--color-brand-700)]"
            >
              Quay lại lộ trình
            </Link>
          )}
        </div>
      </div>
    );
  }

  // No exercises
  if (!exercises || exercises.length === 0) {
    return <ErrorNotice message="Bài học này chưa có bài tập nào." />;
  }

  const exercise = exercises[index];

  // Submit answer
  const handleSubmit = async () => {
    if (busy) return;

    // Validate input based on exercise type
    if (
      (exercise.type === "SIGN_TO_MEANING" || exercise.type === "MEANING_TO_SIGN") &&
      !selectedOptionId
    ) {
      setError("Vui lòng chọn một đáp án");
      return;
    }

    if ((exercise.type === "TYPE_WHAT_YOU_SEE" || exercise.type === "SIGN_VIDEO_RECALL") && !typedAnswer.trim()) {
      setError("Vui lòng nhập câu trả lời");
      return;
    }

    if (exercise.type === "SENTENCE_ORDER" && orderedTokens.length === 0) {
      setError("Vui lòng sắp xếp các từ");
      return;
    }

    if (exercise.type === "MATCH_SIGN_MEANING" && matches.length === 0) {
      setError("Vui lòng ghép các cặp ký hiệu - ý nghĩa");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await apiCall<AnswerResult>(
        `/api/v1/lessons/${lessonId}/exercises/${exercise.id}/answer`,
        {
          method: "POST",
          body: {
            answerType: exercise.type,
            selectedOptionId: selectedOptionId ?? undefined,
            typedAnswer: typedAnswer.trim() || undefined,
            orderedTokens: orderedTokens.length > 0 ? orderedTokens : undefined,
            matches: matches.length > 0 ? matches : undefined,
          },
        }
      );

      setFeedback(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.errorMessage : "Có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  // Continue to next exercise
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

  // Complete lesson
  const completeLesson = async () => {
    setBusy(true);
    try {
      const result = await apiCall<CompleteResult>(`/api/v1/lessons/${lessonId}/complete`, {
        method: "POST",
        body: { idempotencyKey: crypto.randomUUID() },
      });
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.errorMessage : "Không thể hoàn thành bài học");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/hoc" className="text-[var(--color-brand-600)] hover:underline">
          ← Lộ trình
        </Link>
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">{lesson.data.title}</h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {/* Exercise Header with metadata */}
      <ExerciseHeader exercise={exercise} currentIndex={index} totalExercises={exercises.length} />

      {/* Exercise Content */}
      <div className="p-6 bg-white border border-[var(--color-ink-200)] rounded-lg">
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
        />
      </div>

      {/* Error */}
      {error && <ErrorNotice message={error} />}

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg ${
            feedback.isCorrect
              ? "bg-[var(--color-success-50)] border border-[var(--color-success-200)]"
              : "bg-[var(--color-error-50)] border border-[var(--color-error-200)]"
          }`}
        >
          <p
            className={`font-semibold mb-2 ${
              feedback.isCorrect ? "text-[var(--color-success-700)]" : "text-[var(--color-error-700)]"
            }`}
          >
            {feedback.isCorrect ? "✓ Chính xác!" : "✗ Chưa đúng"}
          </p>
          {!feedback.isCorrect && feedback.correctAnswerText && (
            <p className="text-[var(--color-ink-700)]">Đáp án đúng: {feedback.correctAnswerText}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {feedback ? (
          <button
            onClick={handleContinue}
            disabled={busy}
            className="flex-1 py-3 bg-[var(--color-brand-600)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-700)] disabled:opacity-60"
          >
            {index < exercises.length - 1 ? "Tiếp tục" : "Hoàn thành bài học"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 py-3 bg-[var(--color-brand-600)] text-white rounded-lg font-medium hover:bg-[var(--color-brand-700)] disabled:opacity-60"
          >
            {busy ? "Đang kiểm tra..." : "Kiểm tra"}
          </button>
        )}
      </div>
    </div>
  );
}
