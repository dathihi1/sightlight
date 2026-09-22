"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignLightLogo } from "./SignLightLogo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";

export function MarketingNavbar() {
  const { lang, setLang, t } = useLanguage();
  const { isLoggedIn, isClient } = useAuthSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    {
      href: pathname === "/" ? "#our-web" : "/#our-web",
      label: t("Ứng dụng Web", "Our Web"),
      isAnchor: true,
      anchorId: "our-web",
    },
    {
      href: "/about",
      label: t("Về chúng tôi", "About Us"),
      isActive: pathname === "/about",
    },
    {
      href: "/blog",
      label: t("Bài viết", "Blog"),
      isActive: pathname.startsWith("/blog"),
    },
    {
      href: pathname === "/" ? "#businesses" : "/#businesses",
      label: t("Doanh nghiệp", "Businesses"),
      isAnchor: true,
      anchorId: "businesses",
    },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchorId?: string) => {
    if (pathname === "/" && anchorId) {
      e.preventDefault();
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#F4EFE6]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b border-[#E2DBD0]"
          : "bg-[#F4EFE6] border-b border-[#E2DBD0]/70"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-[72px]">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <SignLightLogo size={42} className="transition-transform group-hover:scale-105 duration-200" />
          <span className="text-xl font-extrabold tracking-tight text-[#0F172A] flex items-center">
            SignLight<span className="text-[#0d9fa5] text-2xl leading-none">.</span>
          </span>
        </Link>

        {/* Lingvano-Style Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.anchorId)}
              className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-150 ${
                item.isActive
                  ? "bg-[#e6f7f8] text-[#08757a] border border-[#b2e7e9] shadow-2xs"
                  : "text-[#334155] hover:text-[#0F172A] hover:bg-white/70"
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Action Section */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Segmented Language Switcher */}
          <div
            className="flex items-center p-1 rounded-full bg-white border border-[#E2DBD0] shadow-2xs"
            role="group"
            aria-label={t("Chọn ngôn ngữ", "Select language")}
          >
            <button
              type="button"
              onClick={() => setLang("vi")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === "vi"
                  ? "bg-[#0d9fa5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
              }`}
              title="Tiếng Việt (VSL)"
            >
              <span className="font-extrabold">VI</span>
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                lang === "en"
                  ? "bg-[#0d9fa5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4EFE6]"
              }`}
              title="English (VSL)"
            >
              <span className="font-extrabold">EN</span>
            </button>
          </div>

          <div className="h-5 w-[1px] bg-[#E2DBD0]" />

          {/* Log in Button or User Session */}
          {isClient && isLoggedIn ? (
            <Link
              href="/hoc"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-[0_2px_10px_rgba(13,159,165,0.25)] hover:shadow-[0_4px_16px_rgba(13,159,165,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{t("Vào học ngay", "Go to App")}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/dang-nhap"
                className="px-3.5 py-2 text-sm font-bold text-[#334155] hover:text-[#0d9fa5] hover:bg-white/60 rounded-full transition-all"
              >
                {t("Đăng nhập", "Log in")}
              </Link>

              {/* Primary CTA Button (Lingvano "Learn for free" / "Học miễn phí") */}
              <Link
                href="/dang-ky"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-[0_2px_10px_rgba(13,159,165,0.25)] hover:shadow-[0_4px_16px_rgba(13,159,165,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t("Học miễn phí", "Learn for free")}</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Language Switcher Quick Pill */}
          <div className="flex items-center p-0.5 rounded-full bg-white border border-[#E2DBD0]">
            <button
              type="button"
              onClick={() => setLang("vi")}
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                lang === "vi" ? "bg-[#0d9fa5] text-white" : "text-[#64748B]"
              }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                lang === "en" ? "bg-[#0d9fa5] text-white" : "text-[#64748B]"
              }`}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-white border border-[#E2DBD0] text-[#0F172A] hover:bg-[#EDE6DA] transition-colors"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="marketing-mobile-drawer"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="marketing-mobile-drawer"
          role="region"
          aria-label="Mobile Navigation"
          className="md:hidden border-b border-[#E2DBD0] bg-[#F4EFE6]/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Language Selector inside Drawer */}
          <div className="bg-white rounded-2xl p-2 border border-[#E2DBD0] flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] pl-2">
              {t("Ngôn ngữ hiển thị:", "Display Language:")}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLang("vi")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  lang === "vi"
                    ? "bg-[#0d9fa5] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#F4EFE6]"
                }`}
              >
                Tiếng Việt (VI)
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  lang === "en"
                    ? "bg-[#0d9fa5] text-white shadow-xs"
                    : "text-[#475569] hover:bg-[#F4EFE6]"
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleAnchorClick(e, item.anchorId)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  item.isActive
                    ? "bg-[#e6f7f8] text-[#08757a] border border-[#b2e7e9]"
                    : "text-[#0F172A] hover:bg-white"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="pt-2 border-t border-[#E2DBD0] flex flex-col gap-2.5">
            {isClient && isLoggedIn ? (
              <Link
                href="/hoc"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-full bg-[#0d9fa5] text-white text-sm font-bold shadow-md hover:bg-[#0a8287] transition-colors"
              >
                {t("Vào học ngay", "Go to App")}
              </Link>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full border border-[#E2DBD0] bg-white text-sm font-bold text-[#0F172A] hover:bg-[#F4EFE6] transition-colors"
                >
                  {t("Đăng nhập", "Log in")}
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-full bg-[#0d9fa5] text-white text-sm font-bold shadow-md hover:bg-[#0a8287] transition-colors"
                >
                  {t("Học miễn phí", "Learn for free")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
