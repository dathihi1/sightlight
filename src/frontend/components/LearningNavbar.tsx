"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignLightLogo } from "./SignLightLogo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";

export function LearningNavbar() {
  const { lang, setLang, t } = useLanguage();
  const { isLoggedIn, isClient, user, logout } = useAuthSession();
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
      href: "/hoc",
      label: t("Lộ trình học", "Learning Path"),
      isActive: pathname === "/hoc" || pathname.startsWith("/hoc/bai"),
    },
    {
      href: "/luyen-ai",
      label: t("Luyện Camera", "Camera Practice"),
      isActive: pathname.startsWith("/luyen-ai"),
    },
    {
      href: "/tu-dien",
      label: t("Từ điển VSL", "VSL Dictionary"),
      isActive: pathname.startsWith("/tu-dien"),
    },
    {
      href: "/nang-cap",
      label: t("Gói Premium", "Premium"),
      isActive: pathname.startsWith("/nang-cap") || pathname.startsWith("/thanh-toan"),
    },
  ];

  // Specific runner mode for lesson runner page: clean focus bar
  const isLessonRunner = pathname.startsWith("/hoc/bai/");

  if (isLessonRunner) {
    return (
      <header
        aria-label="Lesson navigation"
        className="sticky top-0 z-50 w-full bg-[#F4EFE6]/95 backdrop-blur-md border-b border-[#E2DBD0] shadow-xs"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 h-[64px]">
          <Link
            href="/hoc"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold text-[#334155] hover:text-[#0F172A] hover:bg-white/80 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>{t("Quay lại lộ trình", "Back to path")}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/hoc" className="flex items-center gap-2 text-sm font-bold text-[#0F172A] hover:text-[#0d9fa5] transition-colors">
              <SignLightLogo size={28} />
              <span>SignLight<span className="text-[#0d9fa5]">.</span></span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#F4EFE6]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b border-[#E2DBD0]"
          : "bg-[#F4EFE6] border-b border-[#E2DBD0]/70"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-[72px]">
        {/* 1. Brand Logo: SignLight. */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href={isLoggedIn ? "/hoc" : "/"} className="flex items-center gap-2.5 group">
            <SignLightLogo size={40} className="transition-transform group-hover:scale-105 duration-200" />
            <span className="text-xl font-extrabold tracking-tight text-[#0F172A] flex items-center">
              SignLight<span className="text-[#0d9fa5] text-2xl leading-none">.</span>
            </span>
          </Link>
        </div>

        {/* 2-5. Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-150 ${
                item.isActive
                  ? "bg-[#e6f7f8] text-[#08757a] border border-[#b2e7e9] shadow-2xs"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-white/70"
              }`}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* 6-8. Right Action Section */}
        <div className="hidden sm:flex items-center gap-3">
          {/* 6. Nút chỉnh tiếng */}
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

          {/* 7. Navbar tài khoản & 8. Thoát */}
          {isClient && isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link
                href="/hanh-trinh"
                title={t("Xem hành trình học tập của bạn", "View your learning journey")}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2DBD0] text-sm font-bold text-[#0F172A] hover:border-[#0d9fa5] hover:bg-white/80 transition-all cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-full bg-[#0d9fa5] text-white flex items-center justify-center text-xs font-bold uppercase group-hover:scale-105 transition-transform">
                  {user?.profile?.displayName ? user.profile.displayName.charAt(0) : "U"}
                </span>
                <span className="max-w-[120px] truncate group-hover:text-[#0d9fa5] transition-colors">
                  {user?.profile?.displayName ?? t("Học viên", "Learner")}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title={t("Thoát tài khoản", "Log out")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("Thoát", "Log out")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/dang-nhap"
                className="px-3.5 py-2 text-sm font-bold text-[#334155] hover:text-[#0d9fa5] hover:bg-white/60 rounded-full transition-all"
              >
                {t("Đăng nhập", "Log in")}
              </Link>
              <Link
                href="/dang-ky"
                className="px-4 py-2 rounded-full text-sm font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-xs transition-all"
              >
                {t("Đăng ký", "Sign up")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
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
            aria-controls="learning-mobile-drawer"
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
          id="learning-mobile-drawer"
          role="region"
          aria-label="Learning Mobile Navigation"
          className="md:hidden border-b border-[#E2DBD0] bg-[#F4EFE6]/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* User status in mobile drawer */}
          {isClient && isLoggedIn && (
            <div className="bg-white rounded-2xl p-3 border border-[#E2DBD0] flex items-center justify-between">
              <Link
                href="/hanh-trinh"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 flex-1 group"
              >
                <span className="w-8 h-8 rounded-full bg-[#0d9fa5] text-white flex items-center justify-center text-sm font-bold uppercase">
                  {user?.profile?.displayName ? user.profile.displayName.charAt(0) : "U"}
                </span>
                <span className="text-sm font-bold text-[#0F172A] group-hover:text-[#0d9fa5] transition-colors">
                  {user?.profile?.displayName ?? t("Học viên", "Learner")}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#ba1a1a]/30 text-xs font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>{t("Thoát", "Log out")}</span>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
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

          {/* Mobile Auth Buttons if guest */}
          {(!isClient || !isLoggedIn) && (
            <div className="pt-2 border-t border-[#E2DBD0] flex flex-col gap-2.5">
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
                {t("Đăng ký tài khoản", "Sign up")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
