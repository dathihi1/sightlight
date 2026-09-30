"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { MissionItem, MissionPeriod } from "../types";

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

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-[#0F172A]">
              {t("Nhiệm vụ & Thử thách học tập", "Learning Missions & Quests")}
            </h3>
            <span className="rounded-full bg-[#e6f7f8] border border-[#b2e7e9] px-2.5 py-0.5 text-xs font-bold text-[#08757a]">
              {completedCount}/{missions.length} {t("Hoàn thành", "Completed")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {t(
              "Rèn luyện kỹ năng mỗi ngày, tích luỹ điểm thưởng và chinh phục các mốc thành tích VSL.",
              "Practice daily skills, earn reward points, and conquer VSL achievement milestones."
            )}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-full bg-[#F4EFE6]/70 border border-[#E2DBD0] text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedPeriod("ALL")}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedPeriod === "ALL" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t("Tất cả", "All")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod("DAILY")}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedPeriod === "DAILY" ? "bg-white text-[#08757a] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t("Hàng ngày", "Daily")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod("WEEKLY")}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedPeriod === "WEEKLY" ? "bg-white text-[#B45309] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t("Hàng tuần", "Weekly")}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod("MILESTONE")}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedPeriod === "MILESTONE" ? "bg-white text-[#8B5CF6] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t("Cột mốc", "Milestone")}
          </button>
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          const progressPercent = Math.min(100, Math.round((mission.current / Math.max(mission.target, 1)) * 100));
          const isClaimReady = mission.status === "COMPLETED";
          const isClaimed = mission.status === "CLAIMED";

          return (
            <div
              key={mission.id}
              className={`p-4.5 rounded-2xl border transition-all space-y-3.5 ${
                isClaimReady
                  ? "bg-[#e6f7f8]/50 border-[#0d9fa5] ring-2 ring-[#0d9fa5]/20 shadow-xs"
                  : isClaimed
                  ? "bg-[#F4EFE6]/50 border-[#E2DBD0] opacity-80"
                  : "bg-white border-[#E2DBD0] hover:border-[#CBD5E1]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      mission.period === "DAILY"
                        ? "bg-[#e6f7f8] text-[#08757a]"
                        : mission.period === "WEEKLY"
                        ? "bg-[#FEF3C7] text-[#B45309]"
                        : "bg-[#F3E8FF] text-[#7E22CE]"
                    }`}
                  >
                    {renderIcon(mission.iconType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0F172A]">
                        {lang === "vi" ? mission.titleVi : mission.titleEn}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/80 border border-[#E2DBD0] text-[#64748B]">
                        {getPeriodLabel(mission.period)}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {lang === "vi" ? mission.descriptionVi : mission.descriptionEn}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                  +{mission.rewardExp} EXP
                </span>
              </div>

              {/* Progress Bar & Actions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#64748B]">
                    {t("Tiến độ", "Progress")}: {mission.current}/{mission.target}{" "}
                    {lang === "vi" ? mission.unitVi : mission.unitEn}
                  </span>
                  <span className={progressPercent === 100 ? "text-[#08757a]" : "text-[#0F172A]"}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full bg-[#F4EFE6] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent === 100 ? "bg-[#0d9fa5]" : "bg-[#08757a]/70"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                {isClaimReady ? (
                  <button
                    type="button"
                    onClick={() => onClaimReward(mission)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] text-white font-bold text-xs shadow-xs transition-all animate-pulse cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t("Nhận thưởng", "Claim Reward")}</span>
                  </button>
                ) : isClaimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#08757a]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t("Đã nhận thưởng", "Claimed")}</span>
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#94A3B8]">
                    {t("Đang thực hiện...", "In Progress...")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
