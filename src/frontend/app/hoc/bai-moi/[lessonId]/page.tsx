"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { LessonIntro } from "@/components/lesson/LessonIntro";
import { ExerciseHeader } from "@/components/lesson/ExerciseHeader";
import { ExerciseRenderer } from "@/components/lesson/ExerciseRenderer";
import { ApiError, apiCall } from "@/lib/api";
import { LessonResult, AnswerResult, CompleteResult } from "@/lib/lesson-types";

/**
 * Lesson page mới với hỗ trợ:
 * - Lesson metadata (summary, topic, level)
 * - Content blocks (intro, objectives, tips)
 * - Exercise metadata (skill, difficulty, instruction)
 * - Exercise types mới (SIGN_VIDEO_RECALL)
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
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
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
  const hasIntro = lesson.data.blocks && lesson.data.blocks.length > 0;

  // Show intro if has blocks and not started yet
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
        onStart={() => setShowIntro(false)}
      />
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
              onClick={() => router.push(`/hoc/bai/${summary.nextLessonId}`)}
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

    setBusy(true);
    setError(null);

    try {
      const result = await apiCall<AnswerResult>(
        `/api/v1/lessons/${lessonId}/exercises/${exercise.id}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            answerType: exercise.type,
            selectedOptionId,
            typedAnswer: typedAnswer.trim() || undefined,
          }),
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
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
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
