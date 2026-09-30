"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { apiCall } from "@/lib/api";
import { IconBell, IconGrid, IconShop } from "@/components/ui/Icons";
import {
  NotificationItem,
  NotificationListResponse,
  NotificationTypeBadge,
  NotificationTypeIcon,
} from "@/components/NotificationDropdown";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PROGRESS" | "STREAK_QUEST" | "STORE" | "UNREAD">("ALL");

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiCall<NotificationListResponse>("/api/v1/notifications?size=50");
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
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
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

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "PROGRESS":
        return notifications.filter((n) => n.type === "PROGRESS" || n.type === "COURSE");
      case "STREAK_QUEST":
        return notifications.filter((n) => n.type === "STREAK" || n.type === "QUEST");
      case "STORE":
        return notifications.filter((n) => n.type === "STORE");
      case "UNREAD":
        return notifications.filter((n) => !n.isRead);
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const progressCount = notifications.filter((n) => n.type === "PROGRESS" || n.type === "COURSE").length;
  const storeCount = notifications.filter((n) => n.type === "STORE").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-sky-800 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <IconBell className="h-3.5 w-3.5" />
              <span>Trung tâm cập nhật học tập</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Thông báo & Tiến độ
            </h1>
            <p className="mt-1 text-sm text-brand-100 sm:text-base">
              Theo dõi kết quả bài học, huy hiệu, hoạt động đổi thưởng và sự kiện mới nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/hoc"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-brand-700 shadow-md transition hover:bg-brand-50"
            >
              <IconGrid className="h-4 w-4" />
              <span>Tiếp tục học</span>
            </Link>
            <Link
              href="/cua-hang"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <IconShop className="h-4 w-4" />
              <span>Cửa hàng EXP</span>
            </Link>
          </div>
        </div>

        {/* Milestone stats */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-5 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <span className="text-xs text-brand-100">Tổng thông báo</span>
            <p className="text-xl font-black sm:text-2xl">{notifications.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <span className="text-xs text-brand-100">Tiến độ bài học</span>
            <p className="text-xl font-black sm:text-2xl">{progressCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <span className="text-xs text-brand-100">Đổi quà cửa hàng</span>
            <p className="text-xl font-black sm:text-2xl">{storeCount}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <span className="text-xs text-brand-100">Chưa đọc</span>
            <p className="text-xl font-black text-amber-300 sm:text-2xl">{unreadCount}</p>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "ALL"
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PROGRESS")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "PROGRESS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            }`}
          >
            <span>🎓</span>
            <span>Tiến độ bài học ({progressCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("STREAK_QUEST")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "STREAK_QUEST"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            }`}
          >
            <span>🔥</span>
            <span>Chuỗi & Nhiệm vụ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("STORE")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "STORE"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            }`}
          >
            <span>🎁</span>
            <span>Cửa hàng ({storeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UNREAD")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "UNREAD"
                ? "bg-danger-600 text-white shadow-sm"
                : "bg-white text-ink-600 border border-ink-200 hover:bg-ink-50"
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="self-start text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline sm:self-auto"
          >
            ✓ Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-ink-200 bg-white p-12 text-ink-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-sm font-medium">Đang tải thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-3xl">
              🌟
            </div>
            <h3 className="mt-4 text-base font-bold text-ink-800">
              {activeTab === "UNREAD" ? "Tuyệt vời! Bạn không có thông báo chưa đọc" : "Chưa có thông báo nào"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
              {activeTab === "PROGRESS"
                ? "Sau khi hoàn thành bất kỳ bài học nào, kết quả điểm số và EXP sẽ hiển thị tự động tại đây."
                : "Tất cả thông báo về khóa học, chuỗi ngày học và điểm thưởng sẽ hiển thị ở trang này."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/hoc" className="btn btn-primary btn-sm">
                Vào học ngay
              </Link>
              <Link href="/cua-hang" className="btn btn-secondary btn-sm">
                Khám phá Cửa hàng
              </Link>
            </div>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const formattedDate = new Date(n.createdAt).toLocaleDateString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`relative flex flex-col gap-4 rounded-3xl border p-5 transition-all sm:flex-row sm:items-start ${
                  !n.isRead
                    ? "border-brand-300 bg-brand-50/20 shadow-sm"
                    : "border-ink-200/80 bg-white hover:border-ink-300"
                }`}
              >
                <NotificationTypeIcon type={n.type} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <NotificationTypeBadge type={n.type} />
                      <span className="text-xs text-ink-400">{formattedDate}</span>
                    </div>

                    {!n.isRead && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                        Mới
                      </span>
                    )}
                  </div>

                  <h3 className={`mt-2 text-base leading-snug ${!n.isRead ? "font-bold text-ink-900" : "font-semibold text-ink-800"}`}>
                    {n.title}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {n.content}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {n.targetUrl && (
                      <Link
                        href={n.targetUrl}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-brand-700"
                      >
                        <span>{n.type === "PROGRESS" ? "Vào bài học tiếp theo" : "Xem chi tiết"}</span>
                        <span>&rarr;</span>
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                        className="text-xs font-semibold text-ink-500 hover:text-ink-800"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
