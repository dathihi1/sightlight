"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";
import {
  IconUsers,
  IconBook,
  IconWebcam,
  IconChart,
  IconShield,
} from "@/components/ui/Icons";

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalLessonsCompleted: number;
  totalAiAttempts: number;
  totalRevenueVnd: number;
  activeSubscriptionsCount: number;
  totalQuestsAvailable: number;
  metricScope: "ALL_TIME" | "DATE_RANGE";
  timeZone: string;
  rangeFrom: string | null;
  rangeToExclusive: string | null;
  recentCompletions: {
    lessonTitle: string;
    userEmail: string;
    scorePercent: number;
    completedAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  const fetchStats = async (range?: { from: string; to: string } | null) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = range
        ? `/api/v1/admin/dashboard/stats?from=${range.from}&to=${range.to}`
        : "/api/v1/admin/dashboard/stats";
      const data = await apiCall<DashboardStats>(endpoint);
      setStats(data);
      setAppliedRange(range ?? null);
    } catch (err: any) {
      setError(err?.errorMessage || "Không thể tải dữ liệu thống kê. Vui lòng kiểm tra quyền Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatInputDate = (value: string) => {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  };

  const applyDateRange = () => {
    setRangeError(null);
    if (!fromDate || !toDate) {
      setRangeError("Chọn đủ cả ngày bắt đầu và ngày kết thúc");
      return;
    }
    if (fromDate > toDate) {
      setRangeError("Ngày bắt đầu không được sau ngày kết thúc");
      return;
    }
    void fetchStats({ from: fromDate, to: toDate });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-ink-200 rounded-md w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-28 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-danger-50 border border-danger-200 rounded-2xl text-center max-w-xl mx-auto my-12">
        <IconShield className="h-10 w-10 text-danger-600 mx-auto mb-2" />
        <h3 className="font-bold text-danger-900 text-lg">Thông báo bảo mật</h3>
        <p className="text-sm text-danger-700 mt-1">{error}</p>
        <p className="text-xs text-danger-500 mt-3">
          Tài khoản cần có quyền <code className="font-mono bg-danger-100 px-1 py-0.5 rounded">ROLE_ADMIN</code> để xem trang này.
        </p>
        <button
          onClick={() => void fetchStats(appliedRange)}
          className="mt-4 px-4 py-2 bg-danger-600 hover:bg-danger-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Báo cáo Tổng quan</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Chỉ số vận hành hệ thống, học viên và nhận diện AI thời gian thực
          </p>
        </div>
        <button
          onClick={() => void fetchStats(appliedRange)}
          className="btn btn-secondary btn-sm self-start sm:self-auto cursor-pointer"
        >
          <span>↻</span>
          <span>Làm mới số liệu</span>
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <label className="text-xs font-semibold text-ink-700">
              Từ ngày
              <input
                aria-label="Từ ngày"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2"
              />
            </label>
            <label className="text-xs font-semibold text-ink-700">
              Đến ngày
              <input
                aria-label="Đến ngày"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={applyDateRange} className="btn btn-primary btn-sm">
              Áp dụng khoảng ngày
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setRangeError(null);
                void fetchStats(null);
              }}
              className="btn btn-secondary btn-sm"
            >
              Xem tất cả
            </button>
          </div>
        </div>
        {rangeError && <p role="alert" className="text-xs font-semibold text-danger-700">{rangeError}</p>}
        <p className="text-xs font-semibold text-ink-600">
          {stats?.metricScope === "DATE_RANGE" && appliedRange
            ? `Từ ${formatInputDate(appliedRange.from)} đến hết ${formatInputDate(appliedRange.to)}`
            : "Tổng từ trước đến nay"}
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Tổng Học Viên</span>
            <IconUsers className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-ink-900">{stats?.totalUsers.toLocaleString("vi-VN")}</p>
            <p className="text-xs font-semibold text-brand-600 mt-1">
              {stats?.activeUsersToday} hoạt động hôm nay
            </p>
          </div>
        </div>

        {/* Card 2: Lessons Completed */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Bài Học Hoàn Thành</span>
            <IconBook className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-ink-900">
              {stats?.totalLessonsCompleted.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-semibold text-ink-500 mt-1">Lượt hoàn thành trong phạm vi đã chọn</p>
          </div>
        </div>

        {/* Card 3: AI Inference */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Thực Hành Camera AI</span>
            <IconWebcam className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-ink-900">
              {stats?.totalAiAttempts.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-semibold text-sky-600 mt-1">Lượt chấm ký hiệu VSL trong phạm vi</p>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Doanh Thu Gói Cước</span>
            <IconChart className="h-5 w-5 text-sun-600" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-brand-500">{formatVnd(stats?.totalRevenueVnd || 0)}</p>
            <p className="text-xs font-semibold text-sun-600 mt-1">Chỉ tính giao dịch PAID</p>
            <p className="text-xs font-semibold text-ink-500 mt-1">
              {stats?.activeSubscriptionsCount} gói Premium
            </p>
            <p className="text-xs font-semibold text-ink-500 mt-1">Đang hiệu lực hiện tại</p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/courses"
          className="card p-5 hover:border-brand-500 transition-all group"
        >
          <IconBook className="h-6 w-6 text-brand-600 mb-2 group-hover:text-brand-700 transition-colors" />
          <h3 className="font-semibold text-ink-900 group-hover:text-brand-500 transition-colors">
            Quản trị Khóa học & Bài học
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            Chỉnh sửa trình tự bài học, thêm bớt bài tập và câu hỏi camera AI
          </p>
        </Link>

        <Link
          href="/admin/quests"
          className="card p-5 hover:border-brand-500 transition-all group"
        >
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold text-ink-900 group-hover:text-brand-500 transition-colors">
            Quản trị Nhiệm vụ Học tập
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            Thiết lập nhiệm vụ ngày, tuần và cấu hình phần thưởng EXP/lượt AI
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="card p-5 hover:border-brand-500 transition-all group"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-ink-900 group-hover:text-brand-500 transition-colors">
            Quản trị Học viên
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            Tra cứu hồ sơ, phân quyền, khóa tài khoản hoặc thưởng EXP hỗ trợ
          </p>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-ink-200 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900 text-sm">Học viên hoàn thành bài học gần đây</h2>
          <span className="text-xs text-ink-500">10 hoạt động mới nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ink-50 text-ink-500 font-bold">
              <tr>
                <th className="px-6 py-3">Học viên</th>
                <th className="px-6 py-3">Bài học</th>
                <th className="px-6 py-3 text-center">Điểm số</th>
                <th className="px-6 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {stats?.recentCompletions && stats.recentCompletions.length > 0 ? (
                stats.recentCompletions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ink-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-ink-800">{row.userEmail}</td>
                    <td className="px-6 py-3.5 text-ink-600">{row.lessonTitle}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          row.scorePercent === 100
                            ? "bg-brand-100 text-brand-800"
                            : "bg-sun-100 text-sun-800"
                        }`}
                      >
                        {row.scorePercent}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-ink-500 font-semibold">
                      {formatDate(row.completedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-500">
                    Chưa có lượt học nào được ghi nhận
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
