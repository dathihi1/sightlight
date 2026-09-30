"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { LearnerStats } from "../types";

interface StatsOverviewProps {
  stats: LearnerStats;
  learnerName: string;
  onOpenShare: () => void;
}

export function StatsOverview({ stats, learnerName, onOpenShare }: StatsOverviewProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* User Hero Showcase Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#08757a] via-[#0d9fa5] to-[#38bdf8] p-1 shadow-md shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-[#08757a] uppercase">
                {learnerName.charAt(0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">{learnerName}</h2>
                <span className="rounded-full bg-[#e6f7f8] border border-[#b2e7e9] px-3 py-0.5 text-xs font-bold text-[#08757a]">
                  {t("Đại sứ VSL", "VSL Ambassador")}
                </span>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-700">
                  {stats.userExp} EXP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B]">
                {t("Mục tiêu học tập: 15 phút mỗi ngày • Lộ trình chuẩn VSL", "Daily Goal: 15 mins/day • Standard VSL Curriculum")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/hoc"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] text-white font-bold text-sm shadow-xs transition-all hover:scale-102"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>{t("Tiếp tục học ngay", "Continue Learning")}</span>
            </Link>
            <button
              type="button"
              onClick={onOpenShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#E2DBD0] bg-[#F4EFE6] hover:bg-white text-[#0F172A] font-bold text-sm transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{t("Tạo thẻ chia sẻ", "Create Share Card")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Statistics Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Stat 1: Completed Lessons */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Bài học hoàn thành", "Completed Lessons")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#e6f7f8] text-[#08757a] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.completedLessons}
            <span className="text-sm font-bold text-[#64748B] ml-1">/{stats.totalLessons}</span>
          </div>
          <div className="w-full bg-[#F4EFE6] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0d9fa5] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100))}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Streak Days */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Chuỗi ngày kiên trì", "Day Streak")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.streakDays}
            <span className="text-sm font-bold text-[#64748B] ml-1">{t("ngày liên tiếp", "days")}</span>
          </div>
          <p className="text-xs text-[#0d9fa5] font-semibold">
            {t("Giữ lửa học tập mỗi ngày", "Keep the learning streak alive")}
          </p>
        </div>

        {/* Stat 3: AI Accuracy */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Độ chuẩn xác AI", "AI Accuracy")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#e6f7f8] text-[#08757a] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.averageScore}%
          </div>
          <p className="text-xs text-[#64748B]">
            {t("Đánh giá cử chỉ qua Camera", "Real-time camera pose feedback")}
          </p>
        </div>

        {/* Stat 4: Mastered Signs */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              {t("Ký hiệu đã thuần thục", "Signs Mastered")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#F4EFE6] text-[#0F172A] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2m-5 9H4a2 2 0 01-2-2v-5a2 2 0 012-2h3" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {stats.signsMastered}
            <span className="text-sm font-bold text-[#64748B] ml-1">{t("từ vựng", "signs")}</span>
          </div>
          <p className="text-xs text-[#64748B]">
            {t("Bao gồm chữ số & từ giao tiếp", "Fingerspelling & everyday words")}
          </p>
        </div>
      </section>
    </div>
  );
}
