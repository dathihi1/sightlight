"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/lib/useAuthSession";
import { IconBook, IconGrid, IconTarget, IconUsers } from "@/components/ui/Icons";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isClient } = useAuthSession();

  const nav = [
    { href: "/admin", label: "Tổng quan", Icon: IconGrid, active: pathname === "/admin" },
    {
      href: "/admin/courses",
      label: "Khoá học & bài học",
      Icon: IconBook,
      active: pathname.startsWith("/admin/courses") || pathname.startsWith("/admin/lessons"),
    },
    { href: "/admin/quests", label: "Nhiệm vụ", Icon: IconTarget, active: pathname.startsWith("/admin/quests") },
    { href: "/admin/users", label: "Học viên", Icon: IconUsers, active: pathname.startsWith("/admin/users") },
  ];
  const name = user?.profile?.displayName || user?.profile?.email || "Admin";

  return (
    <AppShell
      nav={nav}
      title={nav.find((n) => n.active)?.label ?? "Quản trị"}
      menuLabel="Quản trị"
      brandSuffix="Admin"
      sidebarFooter={
        <div className="space-y-3">
          {isClient && user && (
            <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700">
                {name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
                <p className="text-xs text-ink-600">Quản trị viên</p>
              </div>
            </div>
          )}
          {isClient && !user && (
            <Link href="/dang-nhap?next=/admin" className="btn btn-primary btn-sm w-full">
              Đăng nhập quản trị
            </Link>
          )}
        </div>
      }
      topbarRight={
        <Link href="/hoc" className="btn btn-secondary btn-sm">
          Xem giao diện học
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-7xl overflow-x-hidden p-6 sm:p-8">{children}</div>
    </AppShell>
  );
}
