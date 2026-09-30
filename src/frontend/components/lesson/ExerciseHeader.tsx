import { ExerciseNode } from "@/lib/lesson-types";

/** Nhãn kỹ năng / độ khó + lời hướng dẫn của câu hỏi. Tiến độ nằm ở thanh trên cùng của trang bài học. */
export function ExerciseHeader({ exercise }: { exercise: ExerciseNode }) {
  return (
    <div className="space-y-3">
      {(exercise.skill || exercise.difficulty) && (
        <div className="flex flex-wrap gap-2">
          {exercise.skill && <span className="chip bg-sky-100 text-sky-700">{formatSkill(exercise.skill)}</span>}
          {exercise.difficulty && (
            <span className={`chip ${getDifficultyStyle(exercise.difficulty)}`}>{formatDifficulty(exercise.difficulty)}</span>
          )}
        </div>
      )}
      {exercise.instructionText && (
        <h1 className="text-2xl font-bold leading-snug text-ink-900 sm:text-3xl">{exercise.instructionText}</h1>
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
    INTRO: "bg-brand-100 text-brand-700",
    BASIC: "bg-sky-100 text-sky-700",
    INTERMEDIATE: "bg-sun-100 text-sun-700",
    CHALLENGE: "bg-danger-100 text-danger-700",
  };
  return styleMap[difficulty] || "bg-ink-100 text-ink-700";
}
