"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";
import { apiCall } from "@/lib/api";

import {
  JourneyTab,
  LearnerStats,
  BadgeItem,
  MissionItem,
  MissionPeriod,
  GamificationSummaryResponse,
} from "./types";
import {
  getInitialBadges,
  getInitialMissions,
  getInitialMilestones,
  getSharePresets,
} from "./gamificationData";

import { JourneyHeader } from "./components/JourneyHeader";
import { StatsOverview } from "./components/StatsOverview";
import { JourneyMissions } from "./components/JourneyMissions";
import { JourneyBadges } from "./components/JourneyBadges";
import { BadgeDetailModal } from "./components/BadgeDetailModal";
import { JourneyTimeline } from "./components/JourneyTimeline";
import { ShareCardPreview } from "./components/ShareCardPreview";
import { ShareQuoteEditor } from "./components/ShareQuoteEditor";
import { ShareChannelActions } from "./components/ShareChannelActions";
import { RewardStore } from "./components/RewardStore";
import { DailyQuestsWidget } from "@/components/DailyQuestsWidget";

interface MeResult {
  preferences: { activeCourseId: string | null };
  profile: { displayName: string; email?: string };
}

interface LearningPath {
  courseId: string;
  courseName: string;
  nextLessonId: string | null;
  units: UnitNode[];
}

interface UnitNode {
  id: string;
  title: string;
  isFree: boolean;
  chapters: ChapterNode[];
}

interface ChapterNode {
  id: string;
  title: string;
  lessons: LessonNode[];
}

interface LessonNode {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  locked: boolean;
  premiumLocked: boolean;
  bestScorePercent?: number | null;
}

export default function LearningJourneyPage() {
  const { lang, t } = useLanguage();
  const { isLoggedIn, isClient, user: sessionUser } = useAuthSession();

  const [activeTab, setActiveTab] = useState<JourneyTab>("review");
  const [selectedBadgeForModal, setSelectedBadgeForModal] = useState<BadgeItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("empathy");
  const [customQuote, setCustomQuote] = useState<string>("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiCall<MeResult>("/api/v1/me"),
    enabled: isClient && isLoggedIn,
  });

  const activeCourseId = meQuery.data?.preferences.activeCourseId ?? null;

  const pathQuery = useQuery({
    queryKey: ["path", activeCourseId],
    enabled: Boolean(activeCourseId),
    queryFn: () => apiCall<LearningPath>(`/api/v1/courses/${activeCourseId}/path`),
  });

  const gamificationQuery = useQuery({
    queryKey: ["gamification-summary", activeCourseId],
    enabled: Boolean(isClient && isLoggedIn),
    queryFn: () =>
      apiCall<GamificationSummaryResponse>(
        activeCourseId
          ? `/api/v1/gamification/summary?courseId=${activeCourseId}`
          : "/api/v1/gamification/summary"
      ),
  });

  interface BackendQuestProgress {
    questId: string;
    title: string;
    description: string;
    questType: string;
    targetAction: string;
    targetCount: number;
    currentCount: number;
    rewardExp: number;
    rewardAiBonus: number;
    completed: boolean;
    claimed: boolean;
  }

  const questsQuery = useQuery({
    queryKey: ["quests-all"],
    enabled: Boolean(isClient && isLoggedIn),
    queryFn: () => apiCall<BackendQuestProgress[]>("/api/v1/quests"),
  });

  // Listen to balance updates across the app (quests claimed, store purchases, etc.)
  useEffect(() => {
    const handleBalanceUpdate = () => {
      gamificationQuery.refetch();
      questsQuery.refetch();
    };
    window.addEventListener("signlight:balance-update", handleBalanceUpdate);
    return () => window.removeEventListener("signlight:balance-update", handleBalanceUpdate);
  }, [gamificationQuery, questsQuery]);

  // Calculate learner stats from real gamification summary or path data
  const stats: LearnerStats = useMemo(() => {
    let completed = 0;
    let total = 0;
    let scoreSum = 0;
    let scoredLessons = 0;

    if (pathQuery.data) {
      for (const unit of pathQuery.data.units) {
        for (const chapter of unit.chapters) {
          for (const lesson of chapter.lessons) {
            total++;
            if (lesson.status === "COMPLETED") {
              completed++;
              if (lesson.bestScorePercent != null) {
                scoreSum += lesson.bestScorePercent;
                scoredLessons++;
              }
            }
          }
        }
      }
    }

    const gSummary = gamificationQuery.data;

    const streak = gSummary?.streakDays ?? 0;
    const longest = gSummary?.longestStreak ?? 0;
    const avg =
      gSummary?.averageScore ??
      (scoredLessons > 0 ? Math.round(scoreSum / scoredLessons) : 0);
    const completedCount = gSummary?.completedLessons ?? completed;
    const signs = gSummary?.signsMastered ?? (completedCount * 6);
    const totalMins = Math.round(Number(gSummary?.totalMinutesLearned ?? 0));
    const realExp = gSummary?.expBalance ?? 0;

    return {
      completedLessons: completedCount,
      totalLessons: Math.max(total, 1),
      averageScore: avg,
      signsMastered: signs,
      streakDays: streak,
      longestStreak: longest,
      totalMinutes: totalMins,
      userExp: realExp,
    };
  }, [pathQuery.data, gamificationQuery.data]);

  const learnerName =
    meQuery.data?.profile?.displayName ??
    sessionUser?.profile?.displayName ??
    t("Học viên SignLight", "SignLight Learner");

  // Dynamic share URL and domain
  const [shareUrl, setShareUrl] = useState<string>("http://localhost:3000/hanh-trinh");
  const [shareDomain, setShareDomain] = useState<string>("signlight.vn");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setShareUrl(`${window.location.origin}/hanh-trinh`);
      setShareDomain(window.location.host);
    }
  }, []);

  const sharePresets = useMemo(() => {
    return getSharePresets(stats, learnerName);
  }, [stats, learnerName]);

  // Initialize custom quote from default preset if empty
  useEffect(() => {
    if (!customQuote && sharePresets.length > 0) {
      const initial = sharePresets.find((p) => p.id === selectedPresetId) ?? sharePresets[0];
      setCustomQuote(lang === "vi" ? initial.templateVi : initial.templateEn);
    }
  }, [sharePresets, selectedPresetId, customQuote, lang]);

  const badges = useMemo(() => getInitialBadges(stats), [stats]);

  const missions = useMemo<MissionItem[]>(() => {
    if (questsQuery.data && questsQuery.data.length > 0) {
      return questsQuery.data.map((q) => {
        let period: MissionPeriod = "DAILY";
        if (q.questType === "WEEKLY") period = "WEEKLY";
        else if (q.questType === "MILESTONE") period = "MILESTONE";

        let iconType: MissionItem["iconType"] = "target";
        if (q.targetAction === "PRACTICE_AI") iconType = "camera";
        else if (q.targetAction === "COMPLETE_LESSON") iconType = "book";
        else if (q.targetAction === "SCORE_PERFECT") iconType = "trophy";

        let status: MissionItem["status"] = "IN_PROGRESS";
        if (q.claimed) status = "CLAIMED";
        else if (q.completed) status = "COMPLETED";

        return {
          id: q.questId,
          titleVi: q.title,
          titleEn: q.title,
          descriptionVi: q.description || "",
          descriptionEn: q.description || "",
          period,
          target: q.targetCount,
          current: q.currentCount,
          unitVi: "lần",
          unitEn: "times",
          rewardExp: q.rewardExp,
          iconType,
          status,
        };
      });
    }
    return getInitialMissions(stats, []);
  }, [questsQuery.data, stats]);

  const milestones = useMemo(() => getInitialMilestones(stats), [stats]);

  const handleClaimReward = async (mission: MissionItem) => {
    try {
      await apiCall(`/api/v1/quests/${mission.id}/claim`, { method: "POST" });
      questsQuery.refetch();
      gamificationQuery.refetch();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("signlight:balance-update"));
      }
      setToastMessage(
        `+${mission.rewardExp} EXP! ${t("Đã nhận thưởng nhiệm vụ thành công.", "Reward claimed successfully.")}`
      );
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage(t("Không thể nhận thưởng hoặc nhiệm vụ chưa hoàn thành.", "Failed to claim reward."));
      setTimeout(() => setToastMessage(null), 3500);
    }
  };


  const handleCopyAll = () => {
    const fullText = `${customQuote}\n\n👉 Khám phá tại: ${shareUrl}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setToastMessage(t("Đã sao chép thông điệp và liên kết vào bộ nhớ tạm!", "Message & link copied to clipboard!"));
      setTimeout(() => {
        setCopied(false);
        setToastMessage(null);
      }, 3500);
    });
  };

  const handleSelectPreset = (preset: (typeof sharePresets)[0]) => {
    setSelectedPresetId(preset.id);
    setCustomQuote(lang === "vi" ? preset.templateVi : preset.templateEn);
  };

  const handleResetQuote = () => {
    const current = sharePresets.find((p) => p.id === selectedPresetId) ?? sharePresets[0];
    setCustomQuote(lang === "vi" ? current.templateVi : current.templateEn);
  };

  const handleShareBadge = (badge: BadgeItem) => {
    const badgeText =
      lang === "vi"
        ? `"Tự hào mở khoá huy hiệu '${badge.nameVi}' trên SignLight! ${badge.descriptionVi}. Cùng mình học Ngôn ngữ Ký hiệu nhé!"`
        : `"Proud to have unlocked the '${badge.nameEn}' badge on SignLight! ${badge.descriptionEn}. Join me in learning Sign Language!"`;
    setCustomQuote(badgeText);
    setSelectedBadgeForModal(null);
    setActiveTab("share");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-ink-900 px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 border border-white/10">
          <svg className="w-5 h-5 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Tab Switcher */}
      <JourneyHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Profile & Core Stats */}
      <StatsOverview stats={stats} learnerName={learnerName} onOpenShare={() => setActiveTab("share")} />

      {/* TAB 1: REVIEW (Xem lại hành trình) */}
      {activeTab === "review" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Daily Quests Section */}
          <DailyQuestsWidget />

          {/* Missions Section */}
          <JourneyMissions missions={missions} onClaimReward={handleClaimReward} />

          {/* Badges Section */}
          <JourneyBadges badges={badges} onSelectBadge={setSelectedBadgeForModal} />

          {/* Milestones Timeline */}
          <JourneyTimeline milestones={milestones} />
        </div>
      )}

      {/* TAB 2: SHARE (Lan toả & Chia sẻ) */}
      {activeTab === "share" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
          {/* Left: Live Shareable Card Preview (5 cols) */}
          <div className="lg:col-span-5">
            <ShareCardPreview
              stats={stats}
              learnerName={learnerName}
              quoteText={customQuote}
              shareDomain={shareDomain}
            />
          </div>

          {/* Right: Quote Editor & Share Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ShareQuoteEditor
              presets={sharePresets}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              customQuote={customQuote}
              onQuoteChange={setCustomQuote}
              onResetQuote={handleResetQuote}
              stats={stats}
              learnerName={learnerName}
            />

            <ShareChannelActions
              shareUrl={shareUrl}
              shareText={customQuote}
              onCopyAll={handleCopyAll}
              isCopied={copied}
            />
          </div>
        </div>
      )}

      {/* TAB 3: STORE (Tiệm EXP) */}
      {activeTab === "store" && (
        <RewardStore />
      )}

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadgeForModal}
        onClose={() => setSelectedBadgeForModal(null)}
        onShareBadge={handleShareBadge}
      />
    </div>
  );
}
