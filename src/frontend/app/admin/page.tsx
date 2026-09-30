"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  totalLessonsCompleted: number;
  totalAiAttempts: number;
  totalRevenueVnd: number;
  activeSubscriptionsCount: number;
  totalQuestsAvailable: number;
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

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall<DashboardStats>("/api/v1/admin/dashboard/stats");
      setStats(data);
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
        <span className="text-3xl block mb-2">⚠️</span>
        <h3 className="font-bold text-danger-900 text-lg">Thông báo bảo mật</h3>
        <p className="text-sm text-danger-700 mt-1">{error}</p>
        <p className="text-xs text-danger-500 mt-3">
          Tài khoản cần có quyền <code className="font-mono bg-danger-100 px-1 py-0.5 rounded">ROLE_ADMIN</code> để xem trang này.
        </p>
        <button
          onClick={fetchStats}
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
          onClick={fetchStats}
          className="btn btn-secondary btn-sm self-start sm:self-auto cursor-pointer"
        >
          <span>↻</span>
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Tổng Học Viên</span>
            <span className="text-xl">👥</span>
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
            <span className="text-xl">🎓</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-ink-900">
              {stats?.totalLessonsCompleted.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-semibold text-ink-500 mt-1">Lượt hoàn thành tất cả các Unit</p>
          </div>
        </div>

        {/* Card 3: AI Inference */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Thực Hành Camera AI</span>
            <span className="text-xl">📷</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-ink-900">
              {stats?.totalAiAttempts.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-semibold text-sky-600 mt-1">Lượt chấm ký hiệu VSL</p>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-ink-500">Doanh Thu Gói Cước</span>
            <span className="text-xl">💳</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-brand-500">{formatVnd(stats?.totalRevenueVnd || 0)}</p>
            <p className="text-xs font-semibold text-sun-600 mt-1">
              {stats?.activeSubscriptionsCount} gói Premium kích hoạt
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/courses"
          className="card p-5 hover:border-brand-500 transition-all group"
        >
          <div className="text-2xl mb-2">📚</div>
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
