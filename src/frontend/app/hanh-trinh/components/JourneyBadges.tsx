"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { IconCheck } from "@/components/ui/Icons";
import { BadgeItem, BadgeCategory } from "../types";

interface JourneyBadgesProps {
  badges: BadgeItem[];
  onSelectBadge: (badge: BadgeItem) => void;
}

export function JourneyBadges({ badges, onSelectBadge }: JourneyBadgesProps) {
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | BadgeCategory>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNLOCKED" | "IN_PROGRESS" | "LOCKED">("ALL");

  const unlockedCount = useMemo(() => badges.filter((b) => b.unlocked).length, [badges]);

  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      const matchCategory = selectedCategory === "ALL" || b.category === selectedCategory;
      let matchStatus = true;
      if (statusFilter === "UNLOCKED") {
        matchStatus = b.unlocked;
      } else if (statusFilter === "IN_PROGRESS") {
        matchStatus = !b.unlocked && b.progressCurrent > 0;
      } else if (statusFilter === "LOCKED") {
        matchStatus = !b.unlocked && b.progressCurrent === 0;
      }
      return matchCategory && matchStatus;
    });
  }, [badges, selectedCategory, statusFilter]);

  const renderIcon = (type: BadgeItem["iconType"]) => {
    switch (type) {
      case "flame":
      case "fire":
      case "unstoppable":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "camera":
      case "target":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      case "bridge":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        );
      case "heart":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "diamond":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="6 3 18 3 22 9 12 22 2 9 6 3" />
          </svg>
        );
      case "spark":
      default:
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
    }
  };

  return (
    <section className="card p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-ink-900">
              {t("Huy hiệu vinh danh", "Badges & Achievements")}
            </h3>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              {unlockedCount}/{badges.length} {t("Huy hiệu", "Badges")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-600 mt-1">
            {t(
              "Ghi nhận nỗ lực rèn luyện, tôn vinh từng bước tiến trong hành trình học ngôn ngữ ký hiệu.",
              "Honoring your dedication and progress in mastering Vietnamese Sign Language."
            )}
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-full bg-ink-50 border border-ink-200 px-3.5 py-1.5 text-xs font-bold text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
          >
            <option value="ALL">{t("Tất cả trạng thái", "All Status")}</option>
            <option value="UNLOCKED">{t("Đã đạt được", "Earned")}</option>
            <option value="IN_PROGRESS">{t("Đang chinh phục", "In Progress")}</option>
            <option value="LOCKED">{t("Chưa mở khoá", "Locked")}</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            selectedCategory === "ALL"
              ? "border-transparent bg-brand-50 text-brand-700"
              : "border-transparent text-ink-600 hover:bg-ink-50"
          }`}
        >
          {t("Tất cả danh mục", "All Categories")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("FOUNDATION")}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            selectedCategory === "FOUNDATION"
              ? "border-transparent bg-brand-50 text-brand-700"
              : "border-transparent text-ink-600 hover:bg-ink-50"
          }`}
        >
          {t("Nền tảng & Cột mốc", "Foundation")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("STREAK")}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            selectedCategory === "STREAK"
              ? "border-transparent bg-brand-50 text-brand-700"
              : "border-transparent text-ink-600 hover:bg-ink-50"
          }`}
        >
          {t("Kiên trì & Chuỗi ngày", "Streak & Discipline")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("PRECISION")}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            selectedCategory === "PRECISION"
              ? "border-transparent bg-brand-50 text-brand-700"
              : "border-transparent text-ink-600 hover:bg-ink-50"
          }`}
        >
          {t("Chuẩn xác & AI Camera", "Precision & AI")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("COMMUNITY")}
          className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            selectedCategory === "COMMUNITY"
              ? "border-transparent bg-brand-50 text-brand-700"
              : "border-transparent text-ink-600 hover:bg-ink-50"
          }`}
        >
          {t("Cộng đồng & Lan toả", "Community & Inclusion")}
        </button>
      </div>

      {/* Badges Grid — huy chương tròn, màu theo độ hiếm */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredBadges.map((badge) => {
          const medal = !badge.unlocked
            ? { face: "bg-ink-200 text-ink-500", ring: "var(--color-ink-300)" }
            : badge.rarity === "LEGENDARY"
              ? { face: "bg-sun-400 text-ink-900", ring: "var(--color-sun-600)" }
              : badge.rarity === "EPIC"
                ? { face: "bg-grape-500 text-white", ring: "var(--color-grape-700)" }
                : badge.rarity === "RARE"
                  ? { face: "bg-sky-400 text-white", ring: "var(--color-sky-600)" }
                  : { face: "bg-brand-400 text-white", ring: "var(--color-brand-600)" };
          const pct = Math.min(100, Math.round((badge.progressCurrent / Math.max(badge.progressTarget, 1)) * 100));

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onSelectBadge(badge)}
              className="card-flat card-interactive flex flex-col items-center p-5 text-center hover:border-ink-300"
            >
              <span
                className={`grid h-16 w-16 place-items-center rounded-full [&_svg]:h-7 [&_svg]:w-7 ${medal.face}`}
              >
                {renderIcon(badge.iconType)}
              </span>
              <h5 className={`mt-4 text-base font-bold ${badge.unlocked ? "text-ink-900" : "text-ink-600"}`}>
                {lang === "vi" ? badge.nameVi : badge.nameEn}
              </h5>
              <p className="mt-0.5 text-xs font-bold text-ink-500">{badge.rarity}</p>
              {badge.unlocked ? (
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                  <IconCheck className="h-4 w-4" /> {t("Đã đạt", "Earned")}
                </p>
              ) : (
                <div className="mt-3 w-full">
                  <div className="progress h-2.5">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-ink-600">
                    {badge.progressCurrent}/{badge.progressTarget} {lang === "vi" ? badge.unitLabelVi : badge.unitLabelEn}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
