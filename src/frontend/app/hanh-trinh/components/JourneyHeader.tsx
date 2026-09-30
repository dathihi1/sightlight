"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { JourneyTab } from "../types";

interface JourneyHeaderProps {
  activeTab: JourneyTab;
  onTabChange: (tab: JourneyTab) => void;
}

export function JourneyHeader({ activeTab, onTabChange }: JourneyHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
          <Link href="/hoc" className="hover:text-[#0d9fa5] transition-colors">
            {t("Lộ trình học", "Curriculum")}
          </Link>
          <span>/</span>
          <span className="text-[#0d9fa5]">{t("Hành trình cá nhân", "Personal Journey")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          {t("Hành trình VSL của bạn", "Your VSL Journey")}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {t(
            "Nơi ghi dấu từng cột mốc, tôn vinh nỗ lực kiên trì và lan toả ngôn ngữ ký hiệu tới cộng đồng.",
            "Documenting milestones, honoring persistence, and spreading sign language across communities."
          )}
        </p>
      </div>

      {/* Tab Switcher: Xem lại vs Lan toả vs Cửa hàng */}
      <div className="flex items-center p-1.5 rounded-full bg-white border border-[#E2DBD0] shadow-2xs self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onTabChange("review")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
            activeTab === "review"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t("Xem lại hành trình", "Review Journey")}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("share")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
            activeTab === "share"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{t("Lan toả & Chia sẻ", "Spread & Share")}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("store")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer ${
            activeTab === "store"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
          }`}
        >
          <span className="text-base">⭐</span>
          <span>{t("Tiệm EXP", "EXP Store")}</span>
        </button>
      </div>
    </div>
  );
}
