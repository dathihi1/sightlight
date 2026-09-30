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
        return { label: t("Phổ thông", "Common"), color: "bg-ink-100 text-ink-700 border-ink-300" };
      case "RARE":
        return { label: t("Hiếm", "Rare"), color: "bg-brand-50 text-brand-600 border-brand-200" };
      case "EPIC":
        return { label: t("Sử thi", "Epic"), color: "bg-grape-50 text-grape-700 border-grape-200" };
      case "LEGENDARY":
        return { label: t("Huyền thoại", "Legendary"), color: "bg-sun-50 text-sun-700 border-sun-300" };
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
        className="card relative w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Đóng", "Close")}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-ink-50 text-ink-600 hover:text-ink-900 hover:bg-ink-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Badge Hero Display */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div
            className={`w-20 h-20 rounded-full p-1 flex items-center justify-center ${
              badge.unlocked ? "bg-brand-400" : "bg-ink-300"
            }`}
          >
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-brand-600">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase border ${rarityMeta.color}`}>
                {rarityMeta.label}
              </span>
              {badge.unlocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-200">
                  ✓ {t("Đã đạt được", "Earned")}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-ink-600 bg-ink-100 border border-ink-200">
                  {t("Chưa mở khoá", "Locked")}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-ink-900">
              {lang === "vi" ? badge.nameVi : badge.nameEn}
            </h3>
            <p className="text-xs sm:text-sm text-ink-600 max-w-sm">
              {lang === "vi" ? badge.descriptionVi : badge.descriptionEn}
            </p>
          </div>
        </div>

        {/* Criteria & Progress Box */}
        <div className="rounded-2xl bg-ink-50/60 p-4 border border-ink-200 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-ink-600">
              {t("Điều kiện mở khoá", "Unlock Criteria")}
            </span>
            <p className="text-xs font-semibold text-ink-900">
              {lang === "vi" ? badge.criteriaVi : badge.criteriaEn}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-ink-200">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-ink-600">
                {t("Tiến độ hiện tại", "Current Progress")}: {badge.progressCurrent}/{badge.progressTarget}{" "}
                {lang === "vi" ? badge.unitLabelVi : badge.unitLabelEn}
              </span>
              <span className={badge.unlocked ? "text-brand-600" : "text-ink-900"}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-ink-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  badge.unlocked ? "bg-brand-500" : "bg-ink-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {badge.unlockedAt && (
            <p className="text-xs text-brand-600 font-semibold pt-1">
              ✓ {t("Hoàn thành vào ngày", "Achieved on")}: {badge.unlockedAt}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm cursor-pointer"
          >
            {t("Đóng", "Close")}
          </button>

          {badge.unlocked ? (
            <button
              type="button"
              onClick={() => onShareBadge(badge)}
              className="btn btn-primary btn-sm cursor-pointer"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-900 hover:bg-ink-900 text-white font-bold text-xs transition-all"
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
