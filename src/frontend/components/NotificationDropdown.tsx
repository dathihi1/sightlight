"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";
import { IconBell } from "@/components/ui/Icons";

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Vừa xong";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "Hôm qua";
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function NotificationTypeBadge({ type }: { type: string }) {
  switch (type) {
    case "PROGRESS":
    case "COURSE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Tiến độ học
        </span>
      );
    case "STREAK":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Streak
        </span>
      );
    case "STORE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          Cửa hàng
        </span>
      );
    case "QUEST":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Nhiệm vụ
        </span>
      );
    case "ARTICLE":
    case "BLOG":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Bài viết
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
          Hệ thống
        </span>
      );
  }
}

export function NotificationTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "PROGRESS":
    case "COURSE":
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm shadow-emerald-200">
          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      );
    case "STREAK":
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-orange-200">
          <span className="text-base leading-none">🔥</span>
        </div>
      );
    case "STORE":
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 text-white shadow-sm shadow-purple-200">
          <span className="text-base leading-none">🎁</span>
        </div>
      );
    case "QUEST":
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm shadow-sky-200">
          <span className="text-base leading-none">🎯</span>
        </div>
      );
    case "ARTICLE":
    case "BLOG":
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-sm shadow-rose-200">
          <span className="text-base leading-none">📰</span>
        </div>
      );
    default:
      return (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-200">
          <span className="text-base leading-none">🔔</span>
        </div>
      );
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "PROGRESS" | "UNREAD">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiCall<{ unreadCount: number }>("/api/v1/notifications/unread-count");
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiCall<NotificationListResponse>("/api/v1/notifications?size=20");
      if (res) {
        setNotifications(res.items || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 40000); // 40s polling
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string, targetUrl?: string) => {
    try {
      await apiCall(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
    if (targetUrl) {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiCall("/api/v1/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "PROGRESS") {
      return notifications.filter((n) => n.type === "PROGRESS" || n.type === "COURSE");
    }
    if (activeTab === "UNREAD") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        title="Thông báo"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-600 px-1 text-[11px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[420px] overflow-hidden rounded-3xl border border-ink-200/90 bg-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="border-b border-ink-100 bg-gradient-to-r from-ink-50 via-white to-ink-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-100 text-brand-600">
                  <IconBell className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">Thông báo</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600 border border-brand-200/60">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="mt-3 flex items-center gap-1.5 border-t border-ink-100/80 pt-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeTab === "ALL"
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-ink-600 hover:bg-ink-100/70"
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("PROGRESS")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeTab === "PROGRESS"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-ink-600 hover:bg-ink-100/70"
                }`}
              >
                <span>🎓</span>
                <span>Tiến độ học</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("UNREAD")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeTab === "UNREAD"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-ink-600 hover:bg-ink-100/70"
                }`}
              >
                Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-ink-100 overscroll-contain">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 text-ink-400">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="mt-2 text-xs">Đang tải thông báo...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl">
                  ✨
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-800">
                  {activeTab === "UNREAD" ? "Không có thông báo chưa đọc" : "Chưa có thông báo nào"}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {activeTab === "PROGRESS"
                    ? "Hãy hoàn thành thêm bài học để nhận cập nhật tiến độ!"
                    : "Mọi cập nhật học tập, phần thưởng và hoạt động sẽ hiện ở đây."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.targetUrl)}
                  className={`group relative flex gap-3 p-3.5 transition-colors hover:bg-ink-50/80 cursor-pointer ${
                    !n.isRead ? "bg-brand-50/30" : ""
                  }`}
                >
                  <NotificationTypeIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <NotificationTypeBadge type={n.type} />
                        <span className="text-[11px] text-ink-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                      )}
                    </div>

                    <h4 className={`mt-1 text-xs leading-snug ${!n.isRead ? "font-bold text-ink-900" : "font-semibold text-ink-700"}`}>
                      {n.title}
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-ink-500 line-clamp-2">
                      {n.content}
                    </p>

                    {n.targetUrl && (
                      <div className="mt-2">
                        <Link
                          href={n.targetUrl}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                        >
                          <span>{n.type === "PROGRESS" ? "Vào bài tiếp theo" : "Xem chi tiết"}</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-100 bg-ink-50/70 px-4 py-2.5 text-center flex items-center justify-between">
            <Link
              href="/thong-bao"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Trung tâm thông báo &rarr;
            </Link>
            <Link
              href="/cua-hang"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-ink-500 hover:text-ink-800"
            >
              🎁 Cửa hàng EXP
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
