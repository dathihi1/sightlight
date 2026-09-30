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
        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          {t("Xem trước thẻ thành tích", "Live Card Preview")}
        </span>
        <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-2.5 py-0.5 rounded-full border border-[#b2e7e9]">
          {t("Đồng bộ trực tiếp", "Real-time Sync")}
        </span>
      </div>

      {/* The High-End Shareable Card */}
      <div
        id="shareable-journey-card"
        className="relative overflow-hidden rounded-3xl bg-[#0F172A] p-6 sm:p-7 text-white shadow-2xl border border-white/10 transition-all"
      >
        {/* Ambient lighting accents */}
        <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-[#0d9fa5]/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-52 h-52 rounded-full bg-[#F59E0B]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Brand & Badge Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <SignLightLogo size={36} />
              <span className="text-lg font-extrabold tracking-tight">
                SignLight<span className="text-[#0d9fa5]">.</span>
              </span>
            </div>
            <span className="text-xs font-extrabold tracking-wider uppercase bg-white/10 px-3 py-1 rounded-full border border-white/15 text-[#38bdf8]">
              VSL Journey
            </span>
          </div>

          {/* Learner Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#08757a] to-[#38bdf8] p-0.5 shrink-0">
              <div className="w-full h-full rounded-full bg-[#0F172A] flex items-center justify-center text-xl font-black text-white uppercase">
                {learnerName.charAt(0)}
              </div>
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-white leading-tight">{learnerName}</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {t("Học viên Ngôn ngữ Ký hiệu Việt Nam", "Vietnamese Sign Language Learner")}
              </p>
            </div>
          </div>

          {/* Live Inspiring Statement */}
          <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-xs min-h-[90px] flex items-center">
            <p className="text-xs sm:text-sm text-[#E2E8F0] italic leading-relaxed break-words">
              {quoteText || t("Chưa có đoạn văn chia sẻ...", "No message typed yet...")}
            </p>
          </div>

          {/* 3 Golden Metrics */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-3.5 border border-white/10 text-center">
            <div>
              <div className="text-lg sm:text-xl font-black text-[#38bdf8]">{stats.streakDays} {t("ngày", "days")}</div>
              <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Chuỗi học", "Streak")}</div>
            </div>
            <div className="border-x border-white/10">
              <div className="text-lg sm:text-xl font-black text-[#FACC15]">{stats.signsMastered}</div>
              <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Ký hiệu", "Signs")}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-[#4ade80]">{stats.averageScore}%</div>
              <div className="text-[11px] text-[#94A3B8] font-medium uppercase mt-0.5">{t("Chuẩn AI", "Accuracy")}</div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 font-bold truncate max-w-[200px]">
              <span className="truncate">{shareDomain}</span>
              <span>•</span>
              <span className="text-[#38bdf8] shrink-0">{t("Học VSL cùng AI", "Learn VSL with AI")}</span>
            </div>
            <span className="text-[11px] text-white/50 font-mono shrink-0">
              ID: {stats.streakDays}D-{stats.signsMastered}S
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#64748B] text-center">
        {t(
          "Thẻ thành tích đại diện cho sự kiên trì và tinh thần sẻ chia vì một cộng đồng không rào cản.",
          "This achievement card represents persistence and inclusion for a barrier-free society."
        )}
      </p>
    </div>
  );
}
