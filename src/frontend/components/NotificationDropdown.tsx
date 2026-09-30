"use client";

import { useState, useEffect, useRef } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  targetUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiCall<{ unreadCount: number }>("/api/v1/notifications/unread-count");
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // ignore in dev if not logged in
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiCall<NotificationListResponse>("/api/v1/notifications?size=15");
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
    const interval = setInterval(fetchUnreadCount, 45000); // 45s polling
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "QUEST":
        return "🎯";
      case "STREAK":
        return "🔥";
      case "PAYMENT":
        return "💎";
      case "COURSE":
        return "📚";
      default:
        return "🔔";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        title="Thông báo"
        className="relative p-2 rounded-full text-[#475569] hover:text-[#0F172A] hover:bg-white/80 transition-colors cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-500 rounded-full animate-pulse shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2DBD0] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5] border-b border-[#E2DBD0]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0F172A] text-sm">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#e6f7f8] text-[#08757a] rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#0d9fa5] hover:text-[#08757a] hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1EBE1]">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-sm font-semibold text-slate-700">Chưa có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-0.5">Mọi cập nhật học tập sẽ hiện ở đây</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.targetUrl)}
                  className={`p-3.5 flex gap-3 hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                    !n.isRead ? "bg-cyan-50/40" : ""
                  }`}
                >
                  <div className="text-xl shrink-0 mt-0.5">{getTypeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs ${!n.isRead ? "font-bold text-[#0F172A]" : "font-medium text-slate-600"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                    {n.targetUrl && (
                      <Link
                        href={n.targetUrl}
                        className="inline-block mt-1.5 text-[11px] font-bold text-[#0d9fa5] hover:underline"
                      >
                        Xem chi tiết &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
