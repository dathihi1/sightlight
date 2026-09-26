import { ExerciseNode, OptionNode } from "@/lib/lesson-types";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";

interface ExerciseRendererProps {
  exercise: ExerciseNode;
  selectedOptionId: string | null;
  typedAnswer: string;
  onSelectOption: (optionId: string) => void;
  onTypeAnswer: (answer: string) => void;
  disabled: boolean;
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
      {exercise.promptText && (
        <p className="text-lg font-medium text-[var(--color-ink-900)]">{exercise.promptText}</p>
      )}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="max-w-md mx-auto">
          <SignVideoPlayer src={exercise.videoUrl} />
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
      {exercise.promptText && (
        <p className="text-lg font-medium text-[var(--color-ink-900)]">{exercise.promptText}</p>
      )}

      {/* Video */}
      {exercise.videoUrl && (
        <div className="max-w-md mx-auto">
          <SignVideoPlayer src={exercise.videoUrl} />
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
 * Sentence order exercise (placeholder - needs drag & drop)
 */
function SentenceOrderExercise({
  exercise,
  disabled,
}: {
  exercise: ExerciseNode;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Prompt */}
      {exercise.promptText && (
        <p className="text-lg font-medium text-[var(--color-ink-900)]">{exercise.promptText}</p>
      )}

      {/* Tokens */}
      <div className="p-4 bg-[var(--color-ink-50)] rounded-lg">
        <p className="text-sm text-[var(--color-ink-600)] mb-3">Sắp xếp các từ theo thứ tự đúng:</p>
        <div className="flex flex-wrap gap-2">
          {exercise.tokens?.map((token, idx) => (
            <button
              key={idx}
              disabled={disabled}
              className="px-4 py-2 bg-white border-2 border-[var(--color-ink-200)] rounded-lg hover:border-[var(--color-brand-600)] transition-colors disabled:opacity-60"
            >
              {token}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-[var(--color-warning-700)]">
        Chức năng sắp xếp câu đang được phát triển.
      </p>
    </div>
  );
}
