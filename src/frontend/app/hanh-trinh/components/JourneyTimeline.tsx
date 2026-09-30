"use client";

import { useLanguage } from "@/context/LanguageContext";
import { MilestoneItem } from "../types";

interface JourneyTimelineProps {
  milestones: MilestoneItem[];
}

export function JourneyTimeline({ milestones }: JourneyTimelineProps) {
  const { lang, t } = useLanguage();

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      <div className="border-b border-ink-200 pb-4">
        <h3 className="text-xl font-semibold text-ink-900">
          {t("Cột mốc đáng nhớ trong hành trình", "Memorable Milestones")}
        </h3>
        <p className="text-xs sm:text-sm text-ink-600 mt-1">
          {t(
            "Từng bước chân kiên trì học hỏi và đồng hành cùng cộng đồng người Điếc.",
            "Every persistent step taken alongside the Deaf community."
          )}
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-200">
        {milestones.map((m) => {
          const isCompleted = m.status === "COMPLETED";
          const isInProgress = m.status === "IN_PROGRESS";

          return (
            <div key={m.id} className="relative group">
              {/* Dot */}
              {isCompleted ? (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-brand-500 ring-4 ring-brand-50 flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              ) : isInProgress ? (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border border-brand-500 ring-4 ring-ink-50 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                </div>
              ) : (
                <div className="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full bg-white border border-ink-300 ring-4 ring-ink-50 flex items-center justify-center" />
              )}

              {/* Card */}
              <div
                className={`rounded-2xl p-4.5 border transition-all space-y-1 ${
                  isCompleted
                    ? "bg-ink-50/60 border-ink-200 hover:bg-white"
                    : isInProgress
                    ? "bg-white border border-brand-200"
                    : "bg-ink-50/40 border-ink-200 text-ink-500"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4
                    className={`text-base font-bold ${
                      isCompleted ? "text-ink-900" : isInProgress ? "text-ink-900" : "text-ink-600"
                    }`}
                  >
                    {lang === "vi" ? m.titleVi : m.titleEn}
                  </h4>
                  {m.highlightVi && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isCompleted
                          ? "text-brand-600 bg-brand-50 border-brand-200"
                          : isInProgress
                          ? "text-sun-700 bg-sun-100 border-sun-200"
                          : "text-ink-600 bg-white border-ink-200"
                      }`}
                    >
                      {lang === "vi" ? m.highlightVi : m.highlightEn}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm ${
                    isCompleted ? "text-ink-600" : isInProgress ? "text-ink-700" : "text-ink-400"
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
