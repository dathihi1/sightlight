import { ExerciseNode, OptionNode, MatchPair } from "@/lib/lesson-types";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { useState } from "react";

interface ExerciseRendererProps {
  exercise: ExerciseNode;
  selectedOptionId: string | null;
  typedAnswer: string;
  onSelectOption: (optionId: string) => void;
  onTypeAnswer: (answer: string) => void;
  disabled: boolean;
  orderedTokens?: string[];
  onOrderTokens?: (tokens: string[]) => void;
  matches?: MatchPair[];
  onMatches?: (matches: MatchPair[]) => void;
  /** Kết quả chấm của câu hiện tại — để tô đáp án đúng/sai ngay trên thẻ lựa chọn. */
  feedback?: { isCorrect: boolean; correctOptionId: string | null } | null;
}

/**
 * Render exercise dựa trên type
 */
export function ExerciseRenderer({
  exercise,
  selectedOptionId,
  typedAnswer,
  onSelectOption,
  onTypeAnswer,
  disabled,
  orderedTokens,
  onOrderTokens,
  matches,
  onMatches,
  feedback,
}: ExerciseRendererProps) {
  const renderByType = () => {
    switch (exercise.type) {
      case "SIGN_TO_MEANING":
      case "MEANING_TO_SIGN":
        return (
          <ChoiceExercise
            exercise={exercise}
            selectedOptionId={selectedOptionId}
            onSelectOption={onSelectOption}
            disabled={disabled}
            feedback={feedback}
          />
        );

      case "TYPE_WHAT_YOU_SEE":
      case "SIGN_VIDEO_RECALL":
        return (
          <TypedAnswerExercise
            exercise={exercise}
            typedAnswer={typedAnswer}
            onTypeAnswer={onTypeAnswer}
            disabled={disabled}
            feedback={feedback}
          />
        );

      case "SENTENCE_ORDER":
        return (
          <SentenceOrderExercise
            exercise={exercise}
            disabled={disabled}
            orderedTokens={orderedTokens}
            onOrderTokens={onOrderTokens}
          />
        );

      case "MATCH_SIGN_MEANING":
        return (
          <MatchSignMeaningExercise
            exercise={exercise}
            disabled={disabled}
            matches={matches}
            onMatches={onMatches}
          />
        );

      default:
        return (
          <div className="rounded-2xl border border-sun-200 bg-sun-50 p-4">
            <p className="font-bold text-sun-700">
              Loại bài tập <strong>{exercise.type}</strong> chưa được hỗ trợ.
            </p>
          </div>
        );
    }
  };

  return <div className="space-y-4">{renderByType()}</div>;
}

/**
 * Hiển thị đề bài và nổi bật phần ý nghĩa của từ
 */
function FormattedPrompt({ prompt }: { prompt: string }) {
  const meaningMatch = prompt.match(/^(.*?)\((Nghĩa:[^)]+)\)(.*)$/);
  if (meaningMatch) {
    const [, prefix, meaningPart, suffix] = meaningMatch;
    return (
      <div className="space-y-2">
        <p className="text-xl font-bold text-ink-900">
          {prefix.trim()} {suffix.replace(/^[—\s-]+/, "— ").trim()}
        </p>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-2 text-base font-bold text-sun-800">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sun-400 text-xs font-bold text-ink-900" aria-hidden="true">!</span>
          <span>{meaningPart}</span>
        </div>
      </div>
    );
  }

  const hintMatch = prompt.match(/^(.*?)\((Gợi ý nghĩa:[^)]+)\)(.*)$/);
  if (hintMatch) {
    const [, prefix, hintPart, suffix] = hintMatch;
    return (
      <div className="space-y-2">
        <p className="text-xl font-bold text-ink-900">
          {prefix.trim()} {suffix.trim()}
        </p>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-2 text-base font-bold text-sun-800">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sun-400 text-xs font-bold text-ink-900" aria-hidden="true">!</span>
          <span>{hintPart}</span>
        </div>
      </div>
    );
  }

  return <p className="text-xl font-bold text-ink-900">{prompt}</p>;
}

/**
 * Multiple choice exercise
 */
function ChoiceExercise({
  exercise,
  selectedOptionId,
  onSelectOption,
  disabled,
  feedback,
}: {
  exercise: ExerciseNode;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  disabled: boolean;
  feedback?: ExerciseRendererProps["feedback"];
}) {
  return (
    <div className="space-y-4">
      {/* Prompt */}
      {exercise.promptText && <FormattedPrompt prompt={exercise.promptText} />}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="mx-auto max-w-3xl">
          <SignVideoPlayer videoUrl={exercise.videoUrl} />
        </div>
      )}

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {exercise.options?.map((option, i) => {
          const selected = selectedOptionId === option.id;
          // Sau khi chấm: đáp án đúng luôn sáng xanh lá; lựa chọn sai rung + đỏ.
          const right = !!feedback && (feedback.correctOptionId === option.id || (feedback.isCorrect && selected));
          const wrong = !!feedback && selected && !feedback.isCorrect;
          const tone = right
            ? "border-success-500 bg-success-50 text-success-700 ring-2 ring-success-200 animate-pop-in"
            : wrong
              ? "border-danger-400 bg-danger-50 text-danger-700 ring-2 ring-danger-200 animate-shake"
              : selected
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100"
                : feedback
                  ? "border-ink-200 bg-white text-ink-500"
                  : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50";
          return (
            <button
              key={option.id}
              onClick={() => onSelectOption(option.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left text-lg font-bold transition-colors ${tone} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-bold ${
                  right
                    ? "border-success-600 bg-success-600 text-white"
                    : wrong
                      ? "border-danger-600 bg-danger-600 text-white"
                      : selected
                        ? "border-brand-500 text-brand-600"
                        : "border-ink-200 text-ink-500"
                }`}
              >
                {right ? "✓" : wrong ? "✕" : i + 1}
              </span>
              <span className="flex-1">{option.labelText}</span>
              {right && <span className="sr-only">(đáp án đúng)</span>}
              {wrong && <span className="sr-only">(lựa chọn của bạn — chưa đúng)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Typed answer exercise
 */
function TypedAnswerExercise({
  exercise,
  typedAnswer,
  onTypeAnswer,
  disabled,
  feedback,
}: {
  exercise: ExerciseNode;
  typedAnswer: string;
  onTypeAnswer: (answer: string) => void;
  disabled: boolean;
  feedback?: ExerciseRendererProps["feedback"];
}) {
  return (
    <div className="space-y-4">
      {/* Prompt */}
      {exercise.promptText && <FormattedPrompt prompt={exercise.promptText} />}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="mx-auto max-w-3xl">
          <SignVideoPlayer videoUrl={exercise.videoUrl} />
        </div>
      )}

      {/* Text input */}
      <div>
        <input
          type="text"
          value={typedAnswer}
          onChange={(e) => onTypeAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Nhập câu trả lời của bạn..."
          className={`input h-auto min-h-14 py-4 text-lg ${feedback ? (feedback.isCorrect ? "border-success-500 bg-success-50 text-success-700 animate-pop-in" : "border-danger-400 bg-danger-50 text-danger-700 animate-shake") : "disabled:opacity-60"}`}
        />
      </div>
    </div>
  );
}

/**
 * Sentence order exercise with drag & drop
 */
function SentenceOrderExercise({
  exercise,
  disabled,
  orderedTokens,
  onOrderTokens,
}: {
  exercise: ExerciseNode;
  disabled: boolean;
  orderedTokens?: string[];
  onOrderTokens?: (tokens: string[]) => void;
}) {
  const [localTokens, setLocalTokens] = useState<string[]>(orderedTokens || exercise.tokens || []);

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    const newTokens = [...localTokens];
    const [removed] = newTokens.splice(fromIndex, 1);
    newTokens.splice(toIndex, 0, removed);
    setLocalTokens(newTokens);
    onOrderTokens?.(newTokens);
  };

  return (
    <div className="space-y-4">
      {exercise.promptText && (
        <p className="text-xl font-bold text-ink-900">{exercise.promptText}</p>
      )}

      <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 p-5">
        <p className="mb-4 text-base font-bold text-ink-600">Sắp xếp các từ theo thứ tự đúng:</p>
        <div className="flex flex-wrap gap-2">
          {localTokens.map((token, idx) => (
            <div key={idx} className="relative group">
              <button
                disabled={disabled}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-lg font-bold text-ink-800 disabled:opacity-60"
              >
                {token}
              </button>
              {!disabled && (
                <div className="mt-1 flex justify-center gap-1">
                  {idx > 0 && (
                    <button
                      onClick={() => handleMove(idx, idx - 1)}
                      aria-label={`Chuyển "${token}" sang trái`}
                      className="min-h-0 h-8 w-8 rounded-lg bg-sky-100 text-sm font-bold text-sky-700 hover:bg-sky-200"
                    >
                      ←
                    </button>
                  )}
                  {idx < localTokens.length - 1 && (
                    <button
                      onClick={() => handleMove(idx, idx + 1)}
                      aria-label={`Chuyển "${token}" sang phải`}
                      className="min-h-0 h-8 w-8 rounded-lg bg-sky-100 text-sm font-bold text-sky-700 hover:bg-sky-200"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Match sign meaning exercise
 */
function MatchSignMeaningExercise({
  exercise,
  disabled,
  matches,
  onMatches,
}: {
  exercise: ExerciseNode;
  disabled: boolean;
  matches?: MatchPair[];
  onMatches?: (matches: MatchPair[]) => void;
}) {
  const options = exercise.options || [];
  const [localMatches, setLocalMatches] = useState<MatchPair[]>(matches || []);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleSelectPrompt = (promptId: string) => {
    if (disabled) return;
    if (selectedPrompt === promptId) {
      setSelectedPrompt(null);
    } else {
      setSelectedPrompt(promptId);
    }
  };

  const handleSelectOption = (optionId: string) => {
    if (disabled || !selectedPrompt) return;

    const newMatches = localMatches.filter((m) => m.promptId !== selectedPrompt && m.optionId !== optionId);
    newMatches.push({ promptId: selectedPrompt, optionId });
    setLocalMatches(newMatches);
    onMatches?.(newMatches);
    setSelectedPrompt(null);
  };

  const isPromptMatched = (promptId: string) => localMatches.some((m) => m.promptId === promptId);
  const isOptionMatched = (optionId: string) => localMatches.some((m) => m.optionId === optionId);
  const getMatchedOption = (promptId: string) => {
    const match = localMatches.find((m) => m.promptId === promptId);
    return match ? options.find((o) => o.id === match.optionId) : null;
  };

  return (
    <div className="space-y-4">
      {exercise.promptText && (
        <p className="text-xl font-bold text-ink-900">{exercise.promptText}</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Prompts (left side) */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-ink-500">Ký hiệu:</p>
          {options.map((option, idx) => {
            const promptId = `prompt-${idx}`;
            const matched = getMatchedOption(promptId);
            return (
              <button
                key={promptId}
                onClick={() => handleSelectPrompt(promptId)}
                disabled={disabled}
                className={`
                  w-full rounded-2xl border p-4 text-left text-lg font-bold transition-colors
                  ${selectedPrompt === promptId ? "border-brand-500 bg-brand-50" : ""}
                  ${isPromptMatched(promptId) && selectedPrompt !== promptId ? "border-brand-500 bg-brand-50" : ""}
                  ${!isPromptMatched(promptId) && selectedPrompt !== promptId ? "border-ink-200 bg-white hover:bg-ink-50" : ""}
                  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                `}
              >
                <span className="font-semibold text-ink-900">{idx + 1}</span>
                {matched && <span className="ml-2 text-ink-700">→ {matched.labelText}</span>}
              </button>
            );
          })}
        </div>

        {/* Options (right side) */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-ink-500">Ý nghĩa:</p>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option.id)}
              disabled={disabled || !selectedPrompt}
              className={`
                w-full rounded-2xl border p-4 text-left text-lg font-bold transition-colors
                ${isOptionMatched(option.id) ? "border-brand-500 bg-brand-50" : ""}
                ${!isOptionMatched(option.id) ? "border-ink-200 bg-white hover:bg-ink-50" : ""}
                ${disabled || !selectedPrompt ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              `}
            >
              <span className="text-ink-900">{option.labelText}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-base text-ink-600">
        Chọn một ký hiệu bên trái, sau đó chọn ý nghĩa tương ứng bên phải.
      </p>
    </div>
  );
}
