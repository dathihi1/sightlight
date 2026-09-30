"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

interface UserItem {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  expBalance: number;
  aiBonusQuota: number;
  isPremium: boolean;
  planName: string;
  createdAt: string;
}

interface UserListResponse {
  items: UserItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Adjust Balance
  const [adjustingUser, setAdjustingUser] = useState<UserItem | null>(null);
  const [expDelta, setExpDelta] = useState(50);
  const [aiQuotaDelta, setAiQuotaDelta] = useState(5);
  const [adjustReason, setAdjustReason] = useState("Thưởng hỗ trợ học tập");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        size: "15",
      });
      if (search.trim()) query.set("search", search.trim());
      if (statusFilter) query.set("status", statusFilter);

      const res = await apiCall<UserListResponse>(`/api/v1/admin/users?${query.toString()}`);
      if (res) {
        setUsers(res.items || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      setErrorMessage(err?.errorMessage || "Không thể tải danh sách học viên.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === "LOCKED" ? "ACTIVE" : "LOCKED";
    const actionText = newStatus === "LOCKED" ? "khóa" : "mở khóa";
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản ${user.email}?`)) return;

    try {
      await apiCall(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      alert("Lỗi: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  const handleToggleAdminRole = async (user: UserItem) => {
    const hasAdmin = user.roles.some((r) => r.includes("ADMIN"));
    const updatedRoles = hasAdmin
      ? user.roles.filter((r) => !r.includes("ADMIN"))
      : [...user.roles, "ROLE_ADMIN"];

    if (!confirm(`Thay đổi quyền Admin cho tài khoản ${user.email}?`)) return;

    try {
      await apiCall(`/api/v1/admin/users/${user.id}/roles`, {
        method: "PUT",
        body: { roles: updatedRoles },
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, roles: updatedRoles } : u))
      );
    } catch (err: any) {
      alert("Lỗi: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;

    try {
      await apiCall(`/api/v1/admin/users/${adjustingUser.id}/adjust-balance`, {
        method: "POST",
        body: {
          expDelta,
          aiQuotaDelta,
          reason: adjustReason,
        },
      });
      alert("Đã điều chỉnh số dư và gửi thông báo thành công!");
      setAdjustingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert("Lỗi: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản trị Học viên</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tìm kiếm, xem hồ sơ, khóa tài khoản, phân quyền và điều chỉnh EXP/AI
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-[#0d9fa5] text-white text-xs font-bold rounded-xl hover:bg-[#08757a] transition-colors cursor-pointer"
          >
            Tìm
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="p-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đã khóa (LOCKED)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400 animate-pulse">Đang tải danh sách học viên...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Học viên</th>
                  <th className="px-6 py-3.5">Gói cước</th>
                  <th className="px-6 py-3.5 text-center">EXP / Lượt AI</th>
                  <th className="px-6 py-3.5 text-center">Vai trò</th>
                  <th className="px-6 py-3.5 text-center">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isAdmin = u.roles.some((r) => r.includes("ADMIN"));
                  const isLocked = u.status === "LOCKED";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-cyan-100 text-[#0d9fa5] font-black text-xs flex items-center justify-center shrink-0">
                            {u.displayName.charAt(0)}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{u.displayName}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.isPremium ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ★ {u.planName}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-400">Miễn phí</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          {u.expBalance} EXP
                        </span>
                        {u.aiBonusQuota > 0 && (
                          <span className="ml-1.5 font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                            +{u.aiBonusQuota} AI
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAdmin ? (
                          <span className="font-black text-xs text-white bg-slate-900 px-2 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-500">Học viên</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isLocked
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingUser(u);
                            setExpDelta(50);
                            setAiQuotaDelta(5);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold"
                          title="Cộng/Trừ EXP và AI"
                        >
                          Tặng EXP
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAdminRole(u)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold"
                        >
                          {isAdmin ? "Bỏ Admin" : "Lên Admin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                            isLocked
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          {isLocked ? "Mở khóa" : "Khóa"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  &larr; Trước
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-30 cursor-pointer"
                >
                  Sau &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-base mb-1">
              Thưởng / Điều chỉnh tài khoản
            </h3>
            <p className="text-xs text-slate-500 mb-4">{adjustingUser.email}</p>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số EXP điều chỉnh (+ hoặc -)</label>
                <input
                  type="number"
                  value={expDelta}
                  onChange={(e) => setExpDelta(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số lượt Camera AI thưởng thêm</label>
                <input
                  type="number"
                  value={aiQuotaDelta}
                  onChange={(e) => setAiQuotaDelta(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do điều chỉnh (gửi thông báo)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0d9fa5] hover:bg-[#08757a] text-white font-bold transition-colors cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
