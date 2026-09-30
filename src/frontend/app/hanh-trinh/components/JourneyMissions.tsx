"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { MissionItem, MissionPeriod } from "../types";
import { IconCheck } from "@/components/ui/Icons";

interface JourneyMissionsProps {
  missions: MissionItem[];
  onClaimReward: (mission: MissionItem) => void;
}

export function JourneyMissions({ missions, onClaimReward }: JourneyMissionsProps) {
  const { lang, t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | MissionPeriod>("ALL");

  const filteredMissions = useMemo(() => {
    if (selectedPeriod === "ALL") return missions;
    return missions.filter((m) => m.period === selectedPeriod);
  }, [missions, selectedPeriod]);

  const completedCount = useMemo(() => {
    return missions.filter((m) => m.status === "COMPLETED" || m.status === "CLAIMED").length;
  }, [missions]);

  const renderIcon = (type: MissionItem["iconType"]) => {
    switch (type) {
      case "book":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case "camera":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        );
      case "target":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "flame":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "clock":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 14 14" />
          </svg>
        );
      case "share":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        );
      case "trophy":
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34c3.42-.71 6-3.74 6-7.32V4H4v5.34c0 3.58 2.58 6.61 6 7.32z" />
          </svg>
        );
    }
  };

  const getPeriodLabel = (period: MissionPeriod) => {
    switch (period) {
      case "DAILY":
        return t("Hàng ngày", "Daily");
      case "WEEKLY":
        return t("Hàng tuần", "Weekly");
      case "MILESTONE":
        return t("Cột mốc", "Milestone");
    }
  };

  // Nhận được thưởng lên đầu, đang làm ở giữa, đã nhận xuống cuối.
  const order = { COMPLETED: 0, IN_PROGRESS: 1, CLAIMED: 2 } as const;
  const sorted = [...filteredMissions].sort((a, b) => order[a.status] - order[b.status]);
  const periods: ("ALL" | MissionPeriod)[] = ["ALL", "DAILY", "WEEKLY", "MILESTONE"];
  const tone: Record<MissionPeriod, string> = {
    DAILY: "bg-brand-400 text-white",
    WEEKLY: "bg-sun-400 text-ink-900",
    MILESTONE: "bg-grape-500 text-white",
  };

  return (
    <section className="card p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-2xl font-bold text-ink-900">{t("Nhiệm vụ", "Quests")}</h3>
          <p className="mt-1 text-base text-ink-600">
            {t(`Đã xong ${completedCount}/${missions.length}`, `${completedCount}/${missions.length} done`)}
          </p>
        </div>
        <div className="flex gap-1 self-start rounded-2xl border border-ink-200 p-1 sm:self-auto" role="group" aria-label={t("Lọc nhiệm vụ", "Filter quests")}>
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPeriod(p)}
              aria-pressed={selectedPeriod === p}
              className={`min-h-0 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                selectedPeriod === p ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {p === "ALL" ? t("Tất cả", "All") : getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 divide-y divide-ink-100">
        {sorted.map((mission) => {
          const pct = Math.min(100, Math.round((mission.current / Math.max(mission.target, 1)) * 100));
          const ready = mission.status === "COMPLETED";
          const claimed = mission.status === "CLAIMED";

          return (
            <li key={mission.id} className={`flex items-center gap-4 py-4 ${claimed ? "opacity-60" : ""}`}>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone[mission.period]}`}>
                {renderIcon(mission.iconType)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h4 className="text-base font-bold text-ink-900">{lang === "vi" ? mission.titleVi : mission.titleEn}</h4>
                  <span className="text-xs font-bold text-ink-500">{getPeriodLabel(mission.period)}</span>
                </div>
                <p className="text-sm text-ink-600">{lang === "vi" ? mission.descriptionVi : mission.descriptionEn}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="progress h-3 flex-1">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink-600">
                    {mission.current}/{mission.target}
                  </span>
                </div>
              </div>

              <div className="w-32 shrink-0 text-right">
                {ready ? (
                  <button type="button" onClick={() => onClaimReward(mission)} className="btn btn-sun btn-sm w-full">
                    +{mission.rewardExp} XP
                  </button>
                ) : claimed ? (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                    <IconCheck className="h-4 w-4" /> {t("Đã nhận", "Claimed")}
                  </span>
                ) : (
                  <span className="chip bg-sun-50 text-sun-700">+{mission.rewardExp} XP</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
