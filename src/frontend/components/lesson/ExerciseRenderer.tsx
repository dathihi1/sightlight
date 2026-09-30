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
          <div className="p-4 bg-[var(--color-warning-50)] border border-[var(--color-warning-200)] rounded-lg">
            <p className="text-[var(--color-warning-700)]">
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
        <p className="text-lg font-bold text-[var(--color-ink-900)]">
          {prefix.trim()} {suffix.replace(/^[—\s-]+/, "— ").trim()}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 text-sm font-semibold rounded-xl shadow-xs">
          <span>💡</span>
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
        <p className="text-lg font-bold text-[var(--color-ink-900)]">
          {prefix.trim()} {suffix.trim()}
        </p>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 text-sm font-semibold rounded-xl shadow-xs">
          <span>💡</span>
          <span>{hintPart}</span>
        </div>
      </div>
    );
  }

  return <p className="text-lg font-medium text-[var(--color-ink-900)]">{prompt}</p>;
}

/**
 * Multiple choice exercise
 */
function ChoiceExercise({
  exercise,
  selectedOptionId,
  onSelectOption,
  disabled,
}: {
  exercise: ExerciseNode;
  selectedOptionId: string | null;
  onSelectOption: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Prompt */}
      {exercise.promptText && <FormattedPrompt prompt={exercise.promptText} />}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="max-w-md mx-auto">
          <SignVideoPlayer videoUrl={exercise.videoUrl} />
        </div>
      )}

      {/* Options */}
      <div className="grid gap-3">
        {exercise.options?.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelectOption(option.id)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selectedOptionId === option.id
                  ? "border-[var(--color-brand-600)] bg-[var(--color-brand-50)]"
                  : "border-[var(--color-ink-200)] bg-white hover:border-[var(--color-brand-300)]"
              }
              ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="text-[var(--color-ink-900)]">{option.labelText}</span>
          </button>
        ))}
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
}: {
  exercise: ExerciseNode;
  typedAnswer: string;
  onTypeAnswer: (answer: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Prompt */}
      {exercise.promptText && <FormattedPrompt prompt={exercise.promptText} />}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="max-w-md mx-auto">
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
          className="w-full p-4 text-lg border-2 border-[var(--color-ink-200)] rounded-lg focus:border-[var(--color-brand-600)] focus:outline-none disabled:opacity-60"
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
      {exercise.instructionText && (
        <p className="text-sm text-[var(--color-ink-600)]">{exercise.instructionText}</p>
      )}
      {exercise.promptText && (
        <p className="text-lg font-medium text-[var(--color-ink-900)]">{exercise.promptText}</p>
      )}

      <div className="p-4 bg-[var(--color-ink-50)] rounded-lg">
        <p className="text-sm text-[var(--color-ink-600)] mb-3">Sắp xếp các từ theo thứ tự đúng:</p>
        <div className="flex flex-wrap gap-2">
          {localTokens.map((token, idx) => (
            <div key={idx} className="relative group">
              <button
                disabled={disabled}
                className="px-4 py-2 bg-white border-2 border-[var(--color-ink-200)] rounded-lg hover:border-[var(--color-brand-600)] transition-colors disabled:opacity-60"
              >
                {token}
              </button>
              {!disabled && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {idx > 0 && (
                    <button
                      onClick={() => handleMove(idx, idx - 1)}
                      className="w-6 h-6 bg-[var(--color-brand-600)] text-white rounded-full text-xs"
                    >
                      ←
                    </button>
                  )}
                  {idx < localTokens.length - 1 && (
                    <button
                      onClick={() => handleMove(idx, idx + 1)}
                      className="w-6 h-6 bg-[var(--color-brand-600)] text-white rounded-full text-xs"
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
      {exercise.instructionText && (
        <p className="text-sm text-[var(--color-ink-600)]">{exercise.instructionText}</p>
      )}
      {exercise.promptText && (
        <p className="text-lg font-medium text-[var(--color-ink-900)]">{exercise.promptText}</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Prompts (left side) */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-ink-700)]">Ký hiệu:</p>
          {options.map((option, idx) => {
            const promptId = `prompt-${idx}`;
            const matched = getMatchedOption(promptId);
            return (
              <button
                key={promptId}
                onClick={() => handleSelectPrompt(promptId)}
                disabled={disabled}
                className={`
                  w-full p-3 rounded-lg border-2 text-left transition-all
                  ${selectedPrompt === promptId ? "border-[var(--color-brand-600)] bg-[var(--color-brand-50)]" : ""}
                  ${isPromptMatched(promptId) && selectedPrompt !== promptId ? "border-[var(--color-success-600)] bg-[var(--color-success-50)]" : ""}
                  ${!isPromptMatched(promptId) && selectedPrompt !== promptId ? "border-[var(--color-ink-200)] bg-white hover:border-[var(--color-brand-300)]" : ""}
                  ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span className="font-semibold text-[var(--color-ink-900)]">{idx + 1}</span>
                {matched && <span className="ml-2 text-[var(--color-ink-700)]">→ {matched.labelText}</span>}
              </button>
            );
          })}
        </div>

        {/* Options (right side) */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--color-ink-700)]">Ý nghĩa:</p>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option.id)}
              disabled={disabled || !selectedPrompt}
              className={`
                w-full p-3 rounded-lg border-2 text-left transition-all
                ${isOptionMatched(option.id) ? "border-[var(--color-success-600)] bg-[var(--color-success-50)]" : ""}
                ${!isOptionMatched(option.id) ? "border-[var(--color-ink-200)] bg-white hover:border-[var(--color-brand-300)]" : ""}
                ${disabled || !selectedPrompt ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span className="text-[var(--color-ink-900)]">{option.labelText}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--color-ink-600)]">
        Chọn một ký hiệu bên trái, sau đó chọn ý nghĩa tương ứng bên phải.
      </p>
    </div>
  );
}
