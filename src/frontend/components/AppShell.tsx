"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignLightLogo } from "./SignLightLogo";
import { IconMenu } from "@/components/ui/Icons";

export interface ShellNavItem {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  active: boolean;
  badge?: number;
}

/**
 * Khung ứng dụng: sidebar trái (menu + ô cuối sidebar) và thanh trên (tiêu đề + công cụ).
 * Dùng chung cho khu học viên và khu quản trị. Dưới lg: sidebar thành ngăn kéo mở bằng nút menu.
 */
export function AppShell({
  nav,
  title,
  menuLabel = "Menu",
  brandSuffix,
  sidebarFooter,
  topbarRight,
  children,
}: {
  nav: ShellNavItem[];
  title: string;
  menuLabel?: string;
  brandSuffix?: string;
  sidebarFooter?: React.ReactNode;
  topbarRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/" className="flex items-center gap-2.5 px-2">
        <SignLightLogo size={36} />
        <span className="text-xl font-bold tracking-tight text-ink-900">
          SignLight{brandSuffix && <span className="ml-2 text-sm font-semibold text-brand-600">{brandSuffix}</span>}
        </span>
      </Link>

      <p className="mt-9 px-3 text-xs font-semibold uppercase tracking-wider text-ink-500">{menuLabel}</p>
      <nav className="mt-3 flex flex-col gap-1" aria-label={menuLabel}>
        {nav.map(({ href, label, Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-600" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger-600 px-1.5 text-xs font-semibold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {sidebarFooter && <div className="mt-auto pt-6">{sidebarFooter}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-ink-200 bg-white lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <button type="button" className="absolute inset-0 bg-ink-900/40" aria-label="Đóng menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[280px] overflow-y-auto bg-white">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-ink-200 bg-ink-50/85 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 lg:hidden"
            aria-label="Mở menu"
            aria-expanded={open}
          >
            <IconMenu />
          </button>
          <p className="flex-1 truncate text-xl font-semibold text-ink-900">{title}</p>
          <div className="flex items-center gap-2 sm:gap-3">{topbarRight}</div>
        </header>

        <main id="noi-dung-chinh" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
