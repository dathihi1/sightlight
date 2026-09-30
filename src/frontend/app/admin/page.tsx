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
        <div className="h-8 bg-slate-200 rounded-md w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center max-w-xl mx-auto my-12">
        <span className="text-3xl block mb-2">⚠️</span>
        <h3 className="font-bold text-rose-900 text-lg">Thông báo bảo mật</h3>
        <p className="text-sm text-rose-700 mt-1">{error}</p>
        <p className="text-xs text-rose-500 mt-3">
          Tài khoản cần có quyền <code className="font-mono bg-rose-100 px-1 py-0.5 rounded">ROLE_ADMIN</code> để xem trang này.
        </p>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Báo cáo Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Chỉ số vận hành hệ thống, học viên và nhận diện AI thời gian thực
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <span>↻</span>
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Users */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Tổng Học Viên</span>
            <span className="text-xl">👥</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">{stats?.totalUsers.toLocaleString("vi-VN")}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              {stats?.activeUsersToday} hoạt động hôm nay
            </p>
          </div>
        </div>

        {/* Card 2: Lessons Completed */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Bài Học Hoàn Thành</span>
            <span className="text-xl">🎓</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {stats?.totalLessonsCompleted.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Lượt hoàn thành tất cả các Unit</p>
          </div>
        </div>

        {/* Card 3: AI Inference */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Thực Hành Camera AI</span>
            <span className="text-xl">📷</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              {stats?.totalAiAttempts.toLocaleString("vi-VN")}
            </p>
            <p className="text-xs font-medium text-cyan-600 mt-1">Lượt chấm ký hiệu VSL</p>
          </div>
        </div>

        {/* Card 4: Revenue */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Doanh Thu Gói Cước</span>
            <span className="text-xl">💳</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-[#0d9fa5]">{formatVnd(stats?.totalRevenueVnd || 0)}</p>
            <p className="text-xs font-semibold text-amber-600 mt-1">
              {stats?.activeSubscriptionsCount} gói Premium kích hoạt
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/admin/courses"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#0d9fa5] hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-extrabold text-slate-900 group-hover:text-[#0d9fa5] transition-colors">
            Quản trị Khóa học & Bài học
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Chỉnh sửa trình tự bài học, thêm bớt bài tập và câu hỏi camera AI
          </p>
        </Link>

        <Link
          href="/admin/quests"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#0d9fa5] hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-extrabold text-slate-900 group-hover:text-[#0d9fa5] transition-colors">
            Quản trị Nhiệm vụ Học tập
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập nhiệm vụ ngày, tuần và cấu hình phần thưởng EXP/lượt AI
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#0d9fa5] hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-extrabold text-slate-900 group-hover:text-[#0d9fa5] transition-colors">
            Quản trị Học viên
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu hồ sơ, phân quyền, khóa tài khoản hoặc thưởng EXP hỗ trợ
          </p>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-sm">Học viên hoàn thành bài học gần đây</h2>
          <span className="text-xs text-slate-400">10 hoạt động mới nhất</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Học viên</th>
                <th className="px-6 py-3">Bài học</th>
                <th className="px-6 py-3 text-center">Điểm số</th>
                <th className="px-6 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentCompletions && stats.recentCompletions.length > 0 ? (
                stats.recentCompletions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{row.userEmail}</td>
                    <td className="px-6 py-3.5 text-slate-600">{row.lessonTitle}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          row.scorePercent === 100
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {row.scorePercent}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-400 font-medium">
                      {formatDate(row.completedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
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
