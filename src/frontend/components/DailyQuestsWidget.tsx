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
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-ink-200 rounded-sm w-1/3 mb-3"></div>
        <div className="h-10 bg-ink-100 rounded-xl"></div>
      </div>
    );
  }

  if (quests.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h3 className="font-semibold text-ink-900 text-base">Nhiệm vụ hôm nay</h3>
        </div>
        <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2.5 py-1 rounded-full">
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
                  ? "bg-ink-50 border-ink-200 opacity-60"
                  : q.completed
                  ? "bg-sun-50/50 border-sun-200"
                  : "bg-white border-ink-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink-900 truncate">{q.title}</p>
                    <span className="text-xs font-semibold text-sun-600 bg-sun-100/70 px-2 py-0.5 rounded-md shrink-0">
                      +{q.rewardExp} EXP
                      {q.rewardAiBonus > 0 && ` & +${q.rewardAiBonus} AI`}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">{q.description}</p>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden border border-ink-200">
                      <div
                        className={`h-full transition-all duration-500 ${
                          q.completed ? "bg-brand-500" : "bg-brand-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink-500 shrink-0">
                      {q.currentCount}/{q.targetCount}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-center">
                  {q.claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-500 px-3 py-1.5 rounded-full bg-ink-100">
                      ✓ Đã nhận
                    </span>
                  ) : q.completed ? (
                    <button
                      type="button"
                      disabled={claimingId === q.questId}
                      onClick={() => handleClaim(q.questId)}
                      className="btn btn-sun btn-sm"
                    >
                      {claimingId === q.questId ? "Đang nhận..." : "Nhận thưởng!"}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-ink-500">Đang làm</span>
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
