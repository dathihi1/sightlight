"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SignLightLogo } from "@/components/SignLightLogo";
import { LearnerStats } from "../types";

interface ShareCardPreviewProps {
  stats: LearnerStats;
  learnerName: string;
  quoteText: string;
  shareDomain: string;
}

export function ShareCardPreview({ stats, learnerName, quoteText, shareDomain }: ShareCardPreviewProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink-600">
          {t("Xem trước thẻ thành tích", "Live Card Preview")}
        </span>
        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
          {t("Đồng bộ trực tiếp", "Real-time Sync")}
        </span>
      </div>

      {/* The High-End Shareable Card */}
      <div
        id="shareable-journey-card"
        className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 sm:p-7 text-white shadow-2xl border border-white/10 transition-all"
      >
        {/* Ambient lighting accents */}
        <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-brand-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-sun-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Brand & Badge Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <SignLightLogo size={36} />
              <span className="text-lg font-semibold tracking-tight">
                SignLight<span className="text-brand-500">.</span>
              </span>
            </div>
            <span className="text-xs font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/15 text-sky-400">
              VSL Journey
            </span>
          </div>

          {/* Learner Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-sky-400 p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-ink-900 flex items-center justify-center text-xl font-bold text-white uppercase">
                {learnerName.charAt(0)}
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white leading-tight">{learnerName}</h4>
              <p className="text-xs text-ink-500 mt-0.5">
                {t("Học viên Ngôn ngữ Ký hiệu Việt Nam", "Vietnamese Sign Language Learner")}
              </p>
            </div>
          </div>

          {/* Live Inspiring Statement */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs min-h-[90px] flex items-center">
            <p className="text-xs sm:text-sm text-ink-200 italic leading-relaxed break-words">
              {quoteText || t("Chưa có đoạn văn chia sẻ...", "No message typed yet...")}
            </p>
          </div>

          {/* 3 Golden Metrics */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-3.5 border border-white/10 text-center">
            <div>
              <div className="text-lg sm:text-xl font-bold text-sky-400">{stats.streakDays} {t("ngày", "days")}</div>
              <div className="text-xs text-ink-500 font-semibold uppercase mt-0.5">{t("Chuỗi học", "Streak")}</div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-lg sm:text-xl font-bold text-sun-400">{stats.signsMastered}</div>
              <div className="text-xs text-ink-500 font-semibold uppercase mt-0.5">{t("Ký hiệu", "Signs")}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-brand-300">{stats.averageScore}%</div>
              <div className="text-xs text-ink-500 font-semibold uppercase mt-0.5">{t("Chuẩn AI", "Accuracy")}</div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between text-xs text-ink-500 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 font-bold truncate max-w-[200px]">
              <span className="truncate">{shareDomain}</span>
              <span>•</span>
              <span className="text-sky-400 shrink-0">{t("Học VSL cùng AI", "Learn VSL with AI")}</span>
            </div>
            <span className="text-xs text-white/50 font-mono shrink-0">
              ID: {stats.streakDays}D-{stats.signsMastered}S
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-600 text-center">
        {t(
          "Thẻ thành tích đại diện cho sự kiên trì và tinh thần sẻ chia vì một cộng đồng không rào cản.",
          "This achievement card represents persistence and inclusion for a barrier-free society."
        )}
      </p>
    </div>
  );
}
