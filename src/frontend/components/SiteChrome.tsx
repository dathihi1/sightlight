"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { Navbar, LangSwitch } from "./Navbar";
import { Footer } from "./Footer";
import { NotificationDropdown } from "./NotificationDropdown";
import { useLanguage } from "@/context/LanguageContext";
import { useAuthSession } from "@/lib/useAuthSession";
import { IconGrid, IconWebcam, IconBook, IconTrophy, IconCrown, IconSearch, IconLogout, IconArticle, IconShop } from "@/components/ui/Icons";

const APP_PREFIXES = ["/hoc", "/luyen-ai", "/tu-dien", "/cua-hang", "/thong-bao", "/nang-cap", "/thanh-toan", "/hanh-trinh"];

function SearchBox() {
  const { t } = useLanguage();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="hidden items-center gap-2 rounded-full border border-ink-200 bg-white px-4 md:flex"
      onSubmit={(e) => {
        e.preventDefault();
        // điều hướng đầy đủ để trang từ điển đọc lại ?q= kể cả khi đang đứng ở chính trang đó
        if (q.trim()) window.location.assign(`/tu-dien?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <IconSearch className="h-5 w-5 text-ink-400" />
      <label htmlFor="shell-search" className="sr-only">
        {t("Tra ký hiệu", "Search signs")}
      </label>
      <input
        id="shell-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("Tra ký hiệu…", "Search signs…")}
        className="h-11 w-44 bg-transparent text-[15px] text-ink-900 placeholder:text-ink-500 focus:outline-none lg:w-56"
      />
    </form>
  );
}

function LearnerShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { isLoggedIn, isClient, user, logout } = useAuthSession();
  const loggedIn = isClient && isLoggedIn;
  const premium = user?.roles?.includes("LEARNER_PREMIUM");

  const nav = [
    { href: "/hoc", label: t("Tổng quan", "Overview"), Icon: IconGrid, active: pathname === "/hoc" },
    { href: "/luyen-ai", label: t("Luyện camera", "Camera practice"), Icon: IconWebcam, active: pathname.startsWith("/luyen-ai") },
    { href: "/tu-dien", label: t("Từ điển", "Dictionary"), Icon: IconBook, active: pathname.startsWith("/tu-dien") },
    { href: "/cua-hang", label: t("Cửa hàng", "Shop"), Icon: IconShop, active: pathname.startsWith("/cua-hang") },
    { href: "/hanh-trinh", label: t("Hành trình", "Journey"), Icon: IconTrophy, active: pathname.startsWith("/hanh-trinh") },
    { href: "/blog", label: t("Bài viết", "Blog"), Icon: IconArticle, active: pathname.startsWith("/blog") },
    { href: "/nang-cap", label: "Premium", Icon: IconCrown, active: pathname.startsWith("/nang-cap") || pathname.startsWith("/thanh-toan") },
  ];
  const current = nav.find((n) => n.active);

  const upsell = premium ? null : (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden="true" />
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
        <IconCrown className="h-6 w-6" />
      </span>
      <p className="mt-3 text-base font-semibold">{t("Nâng cấp Premium", "Go Premium")}</p>
      <p className="mt-1 text-sm text-white/90">{t("Mở khoá 17 chủ đề và luyện AI không giới hạn.", "Unlock all 17 units and unlimited AI practice.")}</p>
      <Link href="/nang-cap" className="btn btn-sm mt-4 w-full bg-white text-brand-600 hover:bg-brand-50">
        {t("Xem các gói", "See plans")}
      </Link>
    </div>
  );

  const initial = (user?.profile?.displayName || "U").charAt(0).toUpperCase();

  return (
    <AppShell
      nav={nav}
      title={current?.label ?? "SignLight"}
      sidebarFooter={
        <div className="space-y-4">
          {upsell}
          {/* Trên màn nhỏ, thanh trên không đủ chỗ: ngôn ngữ + đăng xuất nằm trong ngăn kéo menu */}
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <LangSwitch />
            {loggedIn && (
              <button type="button" onClick={logout} className="btn btn-ghost btn-sm text-danger-600">
                <IconLogout className="h-4 w-4" /> {t("Đăng xuất", "Log out")}
              </button>
            )}
          </div>
        </div>
      }
      topbarRight={
        <>
          <SearchBox />
          <div className="hidden sm:block">
            <LangSwitch />
          </div>
          {loggedIn ? (
            <>
              <NotificationDropdown />
              {user?.roles?.some((r) => r.includes("ADMIN") || r.includes("CONTENT")) && (
                <Link href="/admin" className="btn btn-secondary btn-sm hidden sm:inline-flex">
                  Admin
                </Link>
              )}
              <Link
                href="/hanh-trinh"
                title={user?.profile?.displayName ?? t("Học viên", "Learner")}
                className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 text-base font-semibold text-brand-700 ring-2 ring-white"
              >
                {initial}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-600 hover:text-danger-600 sm:grid"
                aria-label={t("Đăng xuất", "Log out")}
                title={t("Đăng xuất", "Log out")}
              >
                <IconLogout />
              </button>
            </>
          ) : (
            <Link href={`/dang-nhap?next=${encodeURIComponent(pathname)}`} className="btn btn-primary btn-sm">
              {t("Đăng nhập", "Log in")}
            </Link>
          )}
        </>
      }
    >
      {children}
    </AppShell>
  );
}

/** Chọn khung trang theo route: làm bài (trống) · quản trị (layout riêng) · khu học (AppShell) · marketing (navbar + footer). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/hoc/bai")) {
    return (
      <main id="noi-dung-chinh" className="flex-1">
        {children}
      </main>
    );
  }
  if (pathname.startsWith("/admin")) return <>{children}</>;
  if (APP_PREFIXES.some((p) => pathname.startsWith(p))) return <LearnerShell>{children}</LearnerShell>;

  return (
    <>
      <Navbar />
      <main id="noi-dung-chinh" className="w-full flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
