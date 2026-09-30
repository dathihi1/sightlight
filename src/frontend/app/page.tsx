"use client";

import { useLanguage } from "@/context/LanguageContext";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PathPreview } from "@/components/home/PathPreview";
import { AppShowcase } from "@/components/home/AppShowcase";
import { BusinessSection } from "@/components/home/BusinessSection";
import { DownloadCta } from "@/components/home/DownloadCta";

/** Trang chủ SignLight — phong cách playful (DESIGN.md). Chọn ngôn ngữ nằm trên navbar. */
export default function HomePage() {
  const { lang } = useLanguage();

  return (
    <div className="w-full overflow-hidden">
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <PathPreview />
      <AppShowcase lang={lang} />
      <BusinessSection lang={lang} />
      <DownloadCta />
    </div>
  );
}
