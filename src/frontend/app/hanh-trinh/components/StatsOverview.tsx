"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Mascot } from "@/components/ui/Mascot";
import { IconCheck, IconFlame, IconStar, IconTarget } from "@/components/ui/Icons";
import { LearnerStats } from "../types";

interface StatsOverviewProps {
  stats: LearnerStats;
  learnerName: string;
  onOpenShare: () => void;
}

export function StatsOverview({ stats, learnerName, onOpenShare }: StatsOverviewProps) {
  const { t } = useLanguage();
  const lessonPct = Math.min(100, Math.round((stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100));

  const tiles = [
    {
      label: t("Chuỗi ngày", "Day streak"),
      value: stats.streakDays,
      sub: t(`Dài nhất ${stats.longestStreak} ngày`, `Best ${stats.longestStreak} days`),
      icon: <IconFlame className="h-8 w-8" />,
      tone: "border-flame-200 bg-flame-50 text-flame-700",
    },
    {
      label: "XP",
      value: stats.userExp,
      sub: t(`${stats.totalMinutes} phút đã học`, `${stats.totalMinutes} minutes learned`),
      icon: <IconStar className="h-8 w-8" />,
      tone: "border-sun-200 bg-sun-50 text-sun-700",
    },
    {
      label: t("Ký hiệu đã thuộc", "Signs mastered"),
      value: stats.signsMastered,
      sub: t("gồm chữ số & giao tiếp", "incl. numbers & phrases"),
      icon: (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-400 text-white">
          <IconCheck className="h-5 w-5" />
        </span>
      ),
      tone: "border-brand-200 bg-brand-50 text-brand-600",
    },
    {
      label: t("Độ chuẩn AI", "AI accuracy"),
      value: `${stats.averageScore}%`,
      sub: t("trung bình qua camera", "average on camera"),
      icon: (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-400 text-white">
          <IconTarget className="h-5 w-5" />
        </span>
      ),
      tone: "border-sky-200 bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="card flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-brand-200 bg-brand-50 text-3xl font-bold uppercase text-brand-600">
              {learnerName.charAt(0)}
            </div>
            <Mascot className="absolute -bottom-3 -right-4 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink-900">{learnerName}</h2>
            <p className="mt-1 text-base text-ink-600">
              {t(`${stats.completedLessons}/${stats.totalLessons} bài học`, `${stats.completedLessons}/${stats.totalLessons} lessons`)}
            </p>
            <div className="progress mt-2 h-3 w-56 max-w-full">
              <span style={{ width: `${lessonPct}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/hoc" className="btn btn-primary">
            {t("Học tiếp", "Keep learning")}
          </Link>
          <button type="button" onClick={onOpenShare} className="btn btn-secondary">
            {t("Chia sẻ", "Share")}
          </button>
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className={`rounded-3xl border p-5 ${tile.tone}`}>
            <div className="flex items-center gap-3">
              {tile.icon}
              <p className="text-3xl font-bold tracking-tight">{tile.value}</p>
            </div>
            <p className="mt-2 text-sm font-bold text-ink-700">{tile.label}</p>
            <p className="text-sm text-ink-600">{tile.sub}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
