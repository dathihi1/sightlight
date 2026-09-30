"use client";

import { useLanguage } from "@/context/LanguageContext";
import { IconStar, IconTrophy } from "@/components/ui/Icons";
import { JourneyTab } from "../types";

interface JourneyHeaderProps {
  activeTab: JourneyTab;
  onTabChange: (tab: JourneyTab) => void;
}

export function JourneyHeader({ activeTab, onTabChange }: JourneyHeaderProps) {
  const { t } = useLanguage();

  const tabs: { id: JourneyTab; label: string; icon: React.ReactNode }[] = [
    { id: "review", label: t("Tiến độ", "Progress"), icon: <IconTrophy className="h-5 w-5" /> },
    {
      id: "share",
      label: t("Chia sẻ", "Share"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      ),
    },
    { id: "store", label: t("Cửa hàng XP", "XP shop"), icon: <IconStar className="h-5 w-5" /> },
  ];

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">{t("Hồ sơ", "Profile")}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{t("Hành trình của bạn", "Your journey")}</h1>
      </div>

      <div className="flex gap-1 self-start rounded-2xl border border-ink-200 p-1 sm:self-auto" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[15px] font-semibold transition-colors ${
              activeTab === tab.id ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
