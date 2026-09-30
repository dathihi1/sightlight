"use client";

import { useLanguage } from "@/context/LanguageContext";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { CoreValues } from "@/components/home/CoreValues";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { AppShowcase } from "@/components/home/AppShowcase";
import { Testimonials } from "@/components/home/Testimonials";
import { LivePractice } from "@/components/home/LivePractice";
import { BusinessSection } from "@/components/home/BusinessSection";
import { DownloadCta } from "@/components/home/DownloadCta";

/**
 * SignLight Landing Page (VSL).
 * - Full fidelity UI structure inspired by modern sign learning platforms.
 * - SignLight branding & SVG assets from stitch_signlight_learning_platform_design.zip.
 * - Deep Blue color palette according to design.md.
 * - Strictly VSL (Vietnamese Sign Language) with bilingual (VI / EN) support.
 * - Clean human/educational icons, no AI-looking artifacts.
 */
export default function HomePage() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="w-full overflow-hidden bg-[#F4EFE6]">
      {/* Floating Language Mode Indicator Pill */}
      <div
        className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-xl border border-[#E2DBD0] text-xs"
        suppressHydrationWarning
      >
        <span className="text-[11px] font-bold text-[#64748B] px-2" suppressHydrationWarning>
          {lang === "vi" ? "Ngôn ngữ giao diện:" : "Display language:"}
        </span>
        <button
          type="button"
          onClick={() => setLang("vi")}
          suppressHydrationWarning
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            lang === "vi"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "text-[#475569] hover:bg-[#F4EFE6]"
          }`}
        >
          Tiếng Việt (VSL)
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          suppressHydrationWarning
          className={`px-3 py-1.5 rounded-full font-bold transition-all ${
            lang === "en"
              ? "bg-[#0d9fa5] text-white shadow-xs"
              : "text-[#475569] hover:bg-[#F4EFE6]"
          }`}
        >
          English (VSL)
        </button>
      </div>

      {/* 1. Hero Section */}
      <HeroSection lang={lang} />

      {/* 2. Stats & Numbers Bar */}
      <StatsBar lang={lang} />

      {/* 3. Core Values (Empathy, Kindness, Passion, Dedication) */}
      <CoreValues lang={lang} />

      {/* 4. Core Features (Teachers, Instant Verification, Diverse Lessons) */}
      <CoreFeatures lang={lang} />

      {/* 4. Interactive App Showcase (5-Tab Accordion + Synchronized Desktop Browser) */}
      <AppShowcase lang={lang} />

      {/* 5. User Reviews & Testimonials Carousel */}
      <Testimonials lang={lang} />

      {/* 6. Live Practice Sessions with Deaf Tutors */}
      <LivePractice lang={lang} />

      {/* 7. Enterprise & Organizations Solutions */}
      <BusinessSection lang={lang} />

      {/* 8. Mission Statement & App Download CTA */}
      <DownloadCta lang={lang} />
    </div>
  );
}
