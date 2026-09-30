"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { BadgeItem, BadgeRarity } from "../types";

interface BadgeDetailModalProps {
  badge: BadgeItem | null;
  onClose: () => void;
  onShareBadge: (badge: BadgeItem) => void;
}

export function BadgeDetailModal({ badge, onClose, onShareBadge }: BadgeDetailModalProps) {
  const { lang, t } = useLanguage();

  if (!badge) return null;

  const getRarityBadge = (rarity: BadgeRarity) => {
    switch (rarity) {
      case "COMMON":
        return { label: t("Phổ thông", "Common"), color: "bg-slate-100 text-slate-700 border-slate-300" };
      case "RARE":
        return { label: t("Hiếm", "Rare"), color: "bg-[#e6f7f8] text-[#08757a] border-[#b2e7e9]" };
      case "EPIC":
        return { label: t("Sử thi", "Epic"), color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "LEGENDARY":
        return { label: t("Huyền thoại", "Legendary"), color: "bg-amber-50 text-amber-700 border-amber-300" };
    }
  };

  const rarityMeta = getRarityBadge(badge.rarity);
  const progressPercent = Math.min(100, Math.round((badge.progressCurrent / Math.max(badge.progressTarget, 1)) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E2DBD0] space-y-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Đóng", "Close")}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-[#F4EFE6] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2DBD0] flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Badge Hero Display */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div
            className={`w-20 h-20 rounded-3xl p-1 flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
              badge.unlocked
                ? "bg-gradient-to-tr from-[#08757a] via-[#0d9fa5] to-[#38bdf8]"
                : "bg-gradient-to-tr from-slate-200 to-slate-400"
            }`}
          >
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-[#08757a]">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${rarityMeta.color}`}>
                {rarityMeta.label}
              </span>
              {badge.unlocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-[#08757a] bg-[#e6f7f8] border border-[#b2e7e9]">
                  ✓ {t("Đã đạt được", "Earned")}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-[#64748B] bg-slate-100 border border-slate-200">
                  {t("Chưa mở khoá", "Locked")}
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-[#0F172A]">
              {lang === "vi" ? badge.nameVi : badge.nameEn}
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-sm">
              {lang === "vi" ? badge.descriptionVi : badge.descriptionEn}
            </p>
          </div>
        </div>

        {/* Criteria & Progress Box */}
        <div className="rounded-2xl bg-[#F4EFE6]/60 p-4 border border-[#E2DBD0] space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {t("Điều kiện mở khoá", "Unlock Criteria")}
            </span>
            <p className="text-xs font-semibold text-[#0F172A]">
              {lang === "vi" ? badge.criteriaVi : badge.criteriaEn}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#E2DBD0]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#64748B]">
                {t("Tiến độ hiện tại", "Current Progress")}: {badge.progressCurrent}/{badge.progressTarget}{" "}
                {lang === "vi" ? badge.unitLabelVi : badge.unitLabelEn}
              </span>
              <span className={badge.unlocked ? "text-[#08757a]" : "text-[#0F172A]"}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-[#E2DBD0]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  badge.unlocked ? "bg-[#0d9fa5]" : "bg-[#64748B]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {badge.unlockedAt && (
            <p className="text-[11px] text-[#08757a] font-medium pt-1">
              ✓ {t("Hoàn thành vào ngày", "Achieved on")}: {badge.unlockedAt}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-[#E2DBD0] text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
          >
            {t("Đóng", "Close")}
          </button>

          {badge.unlocked ? (
            <button
              type="button"
              onClick={() => onShareBadge(badge)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>{t("Chia sẻ huy hiệu này", "Share this badge")}</span>
            </button>
          ) : (
            <Link
              href="/hoc"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>{t("Chinh phục ngay", "Conquer Now")}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
