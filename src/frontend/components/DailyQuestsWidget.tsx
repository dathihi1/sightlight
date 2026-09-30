"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

interface QuestProgress {
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

export function DailyQuestsWidget() {
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      const res = await apiCall<QuestProgress[]>("/api/v1/quests/daily");
      if (res) {
        setQuests(res);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleClaim = async (questId: string) => {
    setClaimingId(questId);
    try {
      await apiCall(`/api/v1/quests/${questId}/claim`, { method: "POST" });
      setQuests((prev) =>
        prev.map((q) => (q.questId === questId ? { ...q, claimed: true } : q))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("signlight:balance-update"));
      }
    } catch (err) {
      console.error("Failed to claim quest", err);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-white border border-[#E2DBD0] animate-pulse">
        <div className="h-4 bg-slate-200 rounded-sm w-1/3 mb-3"></div>
        <div className="h-10 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (quests.length === 0) return null;

  return (
    <div className="p-5 rounded-3xl bg-white border border-[#E2DBD0] shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h3 className="font-extrabold text-[#0F172A] text-base">Nhiệm vụ hôm nay</h3>
        </div>
        <span className="text-xs font-bold text-[#0d9fa5] bg-[#e6f7f8] px-2.5 py-1 rounded-full">
          {quests.filter((q) => q.claimed).length}/{quests.length} Đạt được
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((q) => {
          const progressPercent = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));

          return (
            <div
              key={q.questId}
              className={`p-3.5 rounded-2xl border transition-all ${
                q.claimed
                  ? "bg-slate-50 border-slate-200 opacity-60"
                  : q.completed
                  ? "bg-amber-50/50 border-amber-200 shadow-xs"
                  : "bg-white border-[#E2DBD0]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0F172A] truncate">{q.title}</p>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0">
                      +{q.rewardExp} EXP
                      {q.rewardAiBonus > 0 && ` & +${q.rewardAiBonus} AI`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{q.description}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all duration-500 ${
                          q.completed ? "bg-emerald-500" : "bg-[#0d9fa5]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      {q.currentCount}/{q.targetCount}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-center">
                  {q.claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 px-3 py-1.5 rounded-full bg-slate-100">
                      ✓ Đã nhận
                    </span>
                  ) : q.completed ? (
                    <button
                      type="button"
                      disabled={claimingId === q.questId}
                      onClick={() => handleClaim(q.questId)}
                      className="px-3 py-1.5 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer animate-bounce"
                    >
                      {claimingId === q.questId ? "Đang nhận..." : "Nhận thưởng!"}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">Đang làm</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
