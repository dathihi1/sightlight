export type JourneyTab = "review" | "share" | "store";

export type MissionPeriod = "DAILY" | "WEEKLY" | "MILESTONE";
export type MissionStatus = "IN_PROGRESS" | "COMPLETED" | "CLAIMED";

export interface MissionItem {
  id: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  period: MissionPeriod;
  target: number;
  current: number;
  unitVi: string;
  unitEn: string;
  rewardExp: number;
  rewardBadgeId?: string;
  status: MissionStatus;
  iconType: "book" | "flame" | "camera" | "share" | "target" | "trophy" | "clock";
}

export type BadgeCategory = "FOUNDATION" | "STREAK" | "PRECISION" | "COMMUNITY";
export type BadgeRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface BadgeItem {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  unlocked: boolean;
  unlockedAt?: string | null;
  progressCurrent: number;
  progressTarget: number;
  unitLabelVi: string;
  unitLabelEn: string;
  iconType:
    | "spark"
    | "alphabet"
    | "chapter"
    | "halfway"
    | "track"
    | "flame"
    | "fire"
    | "warrior"
    | "unstoppable"
    | "camera"
    | "target"
    | "diamond"
    | "signs50"
    | "signs100"
    | "signs250"
    | "bridge"
    | "heart"
    | "ambassador";
  criteriaVi: string;
  criteriaEn: string;
}

export interface SharePresetTemplate {
  id: string;
  tagVi: string;
  tagEn: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  templateVi: string;
  templateEn: string;
}

export interface LearnerStats {
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  signsMastered: number;
  streakDays: number;
  longestStreak: number;
  totalMinutes: number;
  userExp: number;
}

export interface MilestoneItem {
  id: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
  highlightVi?: string;
  highlightEn?: string;
}

export interface GamificationSummaryResponse {
  streakDays: number;
  longestStreak: number;
  freezeCount: number;
  goalMetToday: boolean;
  dailyGoalMinutes: number;
  totalMinutesLearned: number;
  completedLessons: number;
  signsMastered: number;
  averageScore: number;
}

export type StoreItemType = "CONSUMABLE" | "BADGE";

export interface StoreItem {
  id: string;
  type: StoreItemType;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  expCost: number;
  quantity?: number;
  owned: boolean;
  iconType: "ai_bonus" | "streak_freeze" | "badge_ambassador" | "badge_persistence" | "badge_hero";
}

export interface StoreCatalogResponse {
  expBalance: number;
  aiBonusQuota: number;
  ownedBadges: string[];
  items: StoreItem[];
}
