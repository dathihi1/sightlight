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
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Quản trị Học viên</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Tìm kiếm, xem hồ sơ, khóa tài khoản, phân quyền và điều chỉnh EXP/AI
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3 py-1 bg-danger-600 hover:bg-danger-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm theo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 rounded-xl border border-ink-200 text-xs"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm cursor-pointer"
          >
            Tìm
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-ink-600">Trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="p-2 rounded-xl border border-ink-200 text-xs bg-white font-semibold"
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đã khóa (LOCKED)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-ink-500 animate-pulse">Đang tải danh sách học viên...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50 text-ink-500 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Học viên</th>
                  <th className="px-6 py-3.5">Gói cước</th>
                  <th className="px-6 py-3.5 text-center">EXP / Lượt AI</th>
                  <th className="px-6 py-3.5 text-center">Vai trò</th>
                  <th className="px-6 py-3.5 text-center">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users.map((u) => {
                  const isAdmin = u.roles.some((r) => r.includes("ADMIN"));
                  const isLocked = u.status === "LOCKED";

                  return (
                    <tr key={u.id} className="hover:bg-ink-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-sky-100 text-brand-500 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.displayName.charAt(0)}
                          </span>
                          <div>
                            <p className="font-bold text-ink-900">{u.displayName}</p>
                            <p className="text-ink-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.isPremium ? (
                          <span className="font-bold text-sun-700 bg-sun-50 px-2 py-0.5 rounded border border-sun-200">
                            ★ {u.planName}
                          </span>
                        ) : (
                          <span className="font-semibold text-ink-500">Miễn phí</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-sun-600 bg-sun-50 px-2 py-0.5 rounded">
                          {u.expBalance} EXP
                        </span>
                        {u.aiBonusQuota > 0 && (
                          <span className="ml-1.5 font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                            +{u.aiBonusQuota} AI
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAdmin ? (
                          <span className="font-bold text-xs text-white bg-ink-900 px-2 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        ) : (
                          <span className="font-semibold text-ink-500">Học viên</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isLocked
                              ? "bg-danger-100 text-danger-800"
                              : "bg-brand-100 text-brand-800"
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
                          className="btn btn-secondary btn-sm"
                          title="Cộng/Trừ EXP và AI"
                        >
                          Tặng EXP
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAdminRole(u)}
                          className="btn btn-secondary btn-sm"
                        >
                          {isAdmin ? "Bỏ Admin" : "Lên Admin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                            isLocked
                              ? "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                              : "border border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100"
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
            <div className="px-6 py-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
              <span>Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 rounded border border-ink-200 disabled:opacity-30 cursor-pointer"
                >
                  &larr; Trước
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-ink-200 disabled:opacity-30 cursor-pointer"
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
          <div className="card max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-ink-900 text-base mb-1">
              Thưởng / Điều chỉnh tài khoản
            </h3>
            <p className="text-xs text-ink-500 mb-4">{adjustingUser.email}</p>

            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Số EXP điều chỉnh (+ hoặc -)</label>
                <input
                  type="number"
                  value={expDelta}
                  onChange={(e) => setExpDelta(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-ink-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Số lượt Camera AI thưởng thêm</label>
                <input
                  type="number"
                  value={aiQuotaDelta}
                  onChange={(e) => setAiQuotaDelta(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-ink-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Lý do điều chỉnh (gửi thông báo)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm cursor-pointer"
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
