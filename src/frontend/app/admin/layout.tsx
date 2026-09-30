"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/lib/useAuthSession";
import { SignLightLogo } from "@/components/SignLightLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user, isClient } = useAuthSession();

  const navItems = [
    {
      href: "/admin",
      label: "Tổng quan",
      icon: "📊",
      isActive: pathname === "/admin",
    },
    {
      href: "/admin/courses",
      label: "Khóa học & LMS",
      icon: "📚",
      isActive: pathname.startsWith("/admin/courses") || pathname.startsWith("/admin/lessons"),
    },
    {
      href: "/admin/quests",
      label: "Quản lý Nhiệm vụ",
      icon: "🎯",
      isActive: pathname.startsWith("/admin/quests"),
    },
    {
      href: "/admin/users",
      label: "Quản lý Học viên",
      icon: "👥",
      isActive: pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row text-slate-800 antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <SignLightLogo size={32} />
            <span className="font-extrabold text-white text-base tracking-tight">
              SignLight <span className="text-[#0d9fa5] text-xs px-2 py-0.5 rounded-full bg-slate-800">Admin</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1">
          <div className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Hệ thống Quản trị
          </div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                item.isActive
                  ? "bg-[#0d9fa5] text-white shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Back to Client App & User */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/hoc"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>&larr;</span>
            <span>Quay lại giao diện học</span>
          </Link>

          {isClient && user && (
            <div className="px-3 py-2 rounded-xl bg-slate-800/60 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#0d9fa5] text-white flex items-center justify-center text-xs font-bold uppercase">
                {(user.profile?.displayName || user.profile?.email || "A").charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.profile?.displayName || user.profile?.email || "Admin"}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold">Quyền Quản trị viên</p>
              </div>
            </div>
          )}

          {isClient && !user && (
            <Link
              href="/dang-nhap?redirect=/admin"
              className="block px-3 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold text-center hover:bg-amber-500/30 transition-colors"
            >
              ⚠️ Đăng nhập Quản trị viên &rarr;
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              SignLight LMS Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/hoc"
              className="text-xs font-bold text-[#0d9fa5] hover:underline inline-flex items-center gap-1"
            >
              Xem trang người học &rarr;
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
