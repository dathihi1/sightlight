"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
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
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-[#0F172A]">
              {t("Huy hiệu vinh danh", "Badges & Achievements")}
            </h3>
            <span className="text-xs font-bold text-[#08757a] bg-[#e6f7f8] px-3 py-1 rounded-full border border-[#b2e7e9]">
              {unlockedCount}/{badges.length} {t("Huy hiệu", "Badges")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
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
            className="rounded-full bg-[#F4EFE6] border border-[#E2DBD0] px-3.5 py-1.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]/30 cursor-pointer"
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
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "ALL"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "bg-[#F4EFE6]/70 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0]"
          }`}
        >
          {t("Tất cả danh mục", "All Categories")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("FOUNDATION")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "FOUNDATION"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "bg-[#F4EFE6]/70 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0]"
          }`}
        >
          {t("Nền tảng & Cột mốc", "Foundation")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("STREAK")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "STREAK"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "bg-[#F4EFE6]/70 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0]"
          }`}
        >
          {t("Kiên trì & Chuỗi ngày", "Streak & Discipline")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("PRECISION")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "PRECISION"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "bg-[#F4EFE6]/70 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0]"
          }`}
        >
          {t("Chuẩn xác & AI Camera", "Precision & AI")}
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory("COMMUNITY")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "COMMUNITY"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "bg-[#F4EFE6]/70 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0]"
          }`}
        >
          {t("Cộng đồng & Lan toả", "Community & Inclusion")}
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onSelectBadge(badge)}
              className={`text-left p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                badge.unlocked
                  ? "bg-white border-[#b2e7e9] hover:border-[#0d9fa5] hover:shadow-md hover:-translate-y-0.5"
                  : badge.progressCurrent > 0
                  ? "bg-[#FAF7F2] border-[#E2DBD0] hover:border-[#CBD5E1]"
                  : "bg-[#F4EFE6]/40 border-[#E2DBD0]/60 opacity-60 hover:opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
                      badge.unlocked
                        ? "bg-gradient-to-tr from-[#08757a] to-[#0d9fa5] text-white"
                        : "bg-[#CBD5E1] text-[#64748B]"
                    }`}
                  >
                    {renderIcon(badge.iconType)}
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      badge.rarity === "LEGENDARY"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : badge.rarity === "EPIC"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : badge.rarity === "RARE"
                        ? "bg-[#e6f7f8] text-[#08757a] border-[#b2e7e9]"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {badge.rarity}
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-bold text-[#0F172A] group-hover:text-[#0d9fa5] transition-colors">
                    {lang === "vi" ? badge.nameVi : badge.nameEn}
                  </h5>
                  <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">
                    {lang === "vi" ? badge.descriptionVi : badge.descriptionEn}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2DBD0]/60 mt-3 flex items-center justify-between text-xs">
                {badge.unlocked ? (
                  <span className="font-bold text-[#08757a]">✓ {t("Đã đạt được", "Earned")}</span>
                ) : (
                  <span className="font-semibold text-[#64748B]">
                    {badge.progressCurrent}/{badge.progressTarget} {lang === "vi" ? badge.unitLabelVi : badge.unitLabelEn}
                  </span>
                )}
                <span className="text-[11px] font-bold text-[#0d9fa5] opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("Chi tiết", "Details")} →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
