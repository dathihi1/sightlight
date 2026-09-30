"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignLightLogo } from "./SignLightLogo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";
import { IconMenu } from "@/components/ui/Icons";

export function LangSwitch() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div className="flex rounded-full border border-ink-200 bg-white p-1" role="group" aria-label={t("Chọn ngôn ngữ", "Select language")} suppressHydrationWarning>
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          suppressHydrationWarning
          className={`min-h-0 rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
            lang === l ? "bg-brand-50 text-brand-600" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Navbar của các trang giới thiệu. Khu học tập dùng AppShell (sidebar) thay cho navbar này. */
export function Navbar() {
  const { t } = useLanguage();
  const { isLoggedIn, isClient } = useAuthSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = [
    { href: "/#our-web", label: t("Tính năng", "Features"), active: false },
    { href: "/about", label: t("Về chúng tôi", "About"), active: pathname === "/about" },
    { href: "/blog", label: t("Bài viết", "Blog"), active: pathname.startsWith("/blog") },
    { href: "/#businesses", label: t("Tổ chức", "Organizations"), active: false },
  ];

  const actions =
    isClient && isLoggedIn ? (
      <Link href="/hoc" className="btn btn-primary btn-sm">
        {t("Vào học", "Go to app")}
      </Link>
    ) : (
      <>
        <Link href="/dang-nhap" className="btn btn-ghost btn-sm">
          {t("Đăng nhập", "Log in")}
        </Link>
        <Link href="/dang-ky" className="btn btn-primary btn-sm">
          {t("Học miễn phí", "Start free")}
        </Link>
      </>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="SignLight">
          <SignLightLogo size={36} />
          <span className="text-xl font-bold tracking-tight text-ink-900">SignLight</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("Điều hướng chính", "Main")}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={l.active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-[15px] font-medium transition-colors ${
                l.active ? "bg-brand-50 text-brand-600" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LangSwitch />
          {actions}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LangSwitch />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 text-ink-800"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <IconMenu />
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-ink-200 bg-white px-4 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label={t("Điều hướng chính", "Main")}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-2xl px-4 py-3 text-base font-medium text-ink-800 hover:bg-ink-50">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex gap-3 border-t border-ink-200 pt-4">{actions}</div>
        </div>
      )}
    </header>
  );
}
