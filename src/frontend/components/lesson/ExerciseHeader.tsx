import { ExerciseNode } from "@/lib/lesson-types";

interface ExerciseHeaderProps {
  exercise: ExerciseNode;
  currentIndex: number;
  totalExercises: number;
}

/**
 * Hiển thị metadata của exercise: progress, skill, difficulty, instruction
 */
export function ExerciseHeader({ exercise, currentIndex, totalExercises }: ExerciseHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-[var(--color-ink-600)]">
          <span>
            Câu {currentIndex + 1}/{totalExercises}
          </span>
          <span>{Math.round(((currentIndex + 1) / totalExercises) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--color-ink-200)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-brand-600)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalExercises) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise metadata badges */}
      {(exercise.skill || exercise.difficulty) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {exercise.skill && (
            <span className="px-2 py-1 bg-[var(--color-brand-100)] text-[var(--color-brand-700)] rounded">
              {formatSkill(exercise.skill)}
            </span>
          )}
          {exercise.difficulty && (
            <span
              className={`px-2 py-1 rounded ${getDifficultyStyle(exercise.difficulty)}`}
            >
              {formatDifficulty(exercise.difficulty)}
            </span>
          )}
        </div>
      )}

      {/* Instruction text */}
      {exercise.instructionText && (
        <div className="p-3 bg-[var(--color-ink-50)] border border-[var(--color-ink-200)] rounded-lg">
          <p className="text-sm text-[var(--color-ink-700)]">{exercise.instructionText}</p>
        </div>
      )}
    </div>
  );
}

function formatSkill(skill: string): string {
  const skillMap: Record<string, string> = {
    RECOGNITION: "Nhận diện",
    RECALL: "Nhớ lại",
    PRODUCTION: "Tạo ra",
    ORDERING: "Sắp xếp",
    COMPREHENSION: "Hiểu nghĩa",
    DISCRIMINATION: "Phân biệt",
  };
  return skillMap[skill] || skill;
}

function formatDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    INTRO: "Giới thiệu",
    BASIC: "Cơ bản",
    INTERMEDIATE: "Trung bình",
    CHALLENGE: "Thách thức",
  };
  return difficultyMap[difficulty] || difficulty;
}

function getDifficultyStyle(difficulty: string): string {
  const styleMap: Record<string, string> = {
    INTRO: "bg-[var(--color-success-100)] text-[var(--color-success-700)]",
    BASIC: "bg-[var(--color-info-100)] text-[var(--color-info-700)]",
    INTERMEDIATE: "bg-[var(--color-warning-100)] text-[var(--color-warning-700)]",
    CHALLENGE: "bg-[var(--color-error-100)] text-[var(--color-error-700)]",
  };
  return styleMap[difficulty] || "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]";
}
