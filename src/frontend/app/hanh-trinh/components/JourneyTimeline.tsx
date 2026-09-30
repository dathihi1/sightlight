"use client";

import { useLanguage } from "@/context/LanguageContext";
import { MilestoneItem } from "../types";

interface JourneyTimelineProps {
  milestones: MilestoneItem[];
}

export function JourneyTimeline({ milestones }: JourneyTimelineProps) {
  const { lang, t } = useLanguage();

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
      <div className="border-b border-[#E2DBD0] pb-4">
        <h3 className="text-xl font-extrabold text-[#0F172A]">
          {t("Cột mốc đáng nhớ trong hành trình", "Memorable Milestones")}
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          {t(
            "Từng bước chân kiên trì học hỏi và đồng hành cùng cộng đồng người Điếc.",
            "Every persistent step taken alongside the Deaf community."
          )}
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DBD0]">
        {milestones.map((m) => {
          const isCompleted = m.status === "COMPLETED";
          const isInProgress = m.status === "IN_PROGRESS";

          return (
            <div key={m.id} className="relative group">
              {/* Dot */}
              {isCompleted ? (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-[#0d9fa5] ring-4 ring-[#e6f7f8] flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              ) : isInProgress ? (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#0d9fa5] ring-4 ring-[#F4EFE6] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#0d9fa5]" />
                </div>
              ) : (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#CBD5E1] ring-4 ring-[#F4EFE6] flex items-center justify-center" />
              )}

              {/* Card */}
              <div
                className={`rounded-2xl p-4.5 border transition-all space-y-1 ${
                  isCompleted
                    ? "bg-[#F4EFE6]/60 border-[#E2DBD0] hover:bg-white"
                    : isInProgress
                    ? "bg-white border-2 border-[#b2e7e9] shadow-xs"
                    : "bg-[#F4EFE6]/40 border-[#E2DBD0] text-[#94A3B8]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4
                    className={`text-base font-bold ${
                      isCompleted ? "text-[#0F172A]" : isInProgress ? "text-[#0F172A]" : "text-[#64748B]"
                    }`}
                  >
                    {lang === "vi" ? m.titleVi : m.titleEn}
                  </h4>
                  {m.highlightVi && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompleted
                          ? "text-[#08757a] bg-[#e6f7f8] border-[#b2e7e9]"
                          : isInProgress
                          ? "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]"
                          : "text-[#64748B] bg-white border-[#E2DBD0]"
                      }`}
                    >
                      {lang === "vi" ? m.highlightVi : m.highlightEn}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm ${
                    isCompleted ? "text-[#64748B]" : isInProgress ? "text-[#475569]" : "text-[#94A3B8]"
                  }`}
                >
                  {lang === "vi" ? m.descriptionVi : m.descriptionEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
