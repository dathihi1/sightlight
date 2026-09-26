// Types for lesson and exercise data matching backend DTOs

export interface LessonResult {
  lessonId: string;
  stableKey?: string;
  title: string;
  summary?: string;
  type: string;
  topic?: string;
  targetLevel?: string;
  estimatedMinutes?: number;
  contentVersion?: number;
  learningObjectives?: string[];
  blocks?: ContentBlockNode[];
  resumeAtIndex: number;
  exercises: ExerciseNode[];
}

export interface ContentBlockNode {
  id: string;
  stableKey: string;
  blockType: string;
  title?: string;
  bodyText?: string;
  payload?: any;
  signId?: string;
  mediaRef?: string;
  required: boolean;
}

export interface ExerciseNode {
  id: string;
  stableKey?: string;
  type: string;
  skill?: string;
  difficulty?: string;
  instructionText?: string;
  promptText: string | null;
  videoUrl: string | null;
  placeholderVideo: boolean;
  options: OptionNode[] | null;
  tokens: string[] | null;
}

export interface OptionNode {
  id: string;
  labelText: string;
  videoUrl: string | null;
}

export interface AnswerResult {
  isCorrect: boolean;
  attemptNo: number;
  correctOptionId: string | null;
  correctAnswerText: string | null;
  willRepeat: boolean;
}

export interface CompleteResult {
  scorePercent: number;
  firstTryPerfect: boolean;
  effectiveMinutes: number;
  streak: {
    current: number;
    longest: number;
    freezeCount: number;
    goalMetToday: boolean;
  };
  newSignsLearned: number;
  nextLessonId: string | null;
}
