"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

interface QuestItem {
  id: string;
  title: string;
  description: string;
  questType: string;
  targetAction: string;
  targetCount: number;
  rewardExp: number;
  rewardAiBonus: number;
  active: boolean;
  orderIndex: number;
  createdAt: string;
}

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questType, setQuestType] = useState("DAILY");
  const [targetAction, setTargetAction] = useState("COMPLETE_LESSON");
  const [targetCount, setTargetCount] = useState(1);
  const [rewardExp, setRewardExp] = useState(20);
  const [rewardAiBonus, setRewardAiBonus] = useState(0);

  const fetchQuests = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiCall<QuestItem[]>("/api/v1/admin/quests");
      if (res) {
        setQuests(res);
      }
    } catch (err: any) {
      console.error("Failed to load quests", err);
      setErrorMessage(err?.errorMessage || "Không thể tải danh sách nhiệm vụ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleToggleActive = async (id: string) => {
    try {
      const res = await apiCall<{ active: boolean }>(`/api/v1/admin/quests/${id}/toggle`, {
        method: "PATCH",
      });
      setQuests((prev) =>
        prev.map((q) => (q.id === id ? { ...q, active: res.active } : q))
      );
    } catch (err: any) {
      alert("Lỗi khi đổi trạng thái: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) return;
    try {
      await apiCall(`/api/v1/admin/quests/${id}`, { method: "DELETE" });
      setQuests((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert("Lỗi khi xóa: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  const openCreateModal = () => {
    setEditingQuest(null);
    setTitle("");
    setDescription("");
    setQuestType("DAILY");
    setTargetAction("COMPLETE_LESSON");
    setTargetCount(1);
    setRewardExp(20);
    setRewardAiBonus(0);
    setShowModal(true);
  };

  const openEditModal = (q: QuestItem) => {
    setEditingQuest(q);
    setTitle(q.title);
    setDescription(q.description || "");
    setQuestType(q.questType);
    setTargetAction(q.targetAction);
    setTargetCount(q.targetCount);
    setRewardExp(q.rewardExp);
    setRewardAiBonus(q.rewardAiBonus);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      description,
      questType,
      targetAction,
      targetCount,
      rewardExp,
      rewardAiBonus,
      active: editingQuest ? editingQuest.active : true,
      orderIndex: editingQuest ? editingQuest.orderIndex : quests.length + 1,
    };

    try {
      if (editingQuest) {
        await apiCall(`/api/v1/admin/quests/${editingQuest.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiCall("/api/v1/admin/quests", {
          method: "POST",
          body: payload,
        });
      }
      setShowModal(false);
      fetchQuests();
    } catch (err: any) {
      alert("Lỗi: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Quản trị Nhiệm vụ Học tập</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Cấu hình nhiệm vụ Ngày / Tuần để kích thích học viên duy trì Streak và luyện tập
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary btn-sm self-start sm:self-auto cursor-pointer"
        >
          <span>+</span> Tạo Nhiệm Vụ Mới
        </button>
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
            onClick={fetchQuests}
            className="px-3 py-1 bg-danger-600 hover:bg-danger-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-ink-500 animate-pulse">Đang tải danh sách nhiệm vụ...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50 text-ink-500 font-bold">
                <tr>
                  <th className="px-6 py-3.5">Nhiệm vụ</th>
                  <th className="px-6 py-3.5">Loại</th>
                  <th className="px-6 py-3.5">Hành động mục tiêu</th>
                  <th className="px-6 py-3.5 text-center">Yêu cầu</th>
                  <th className="px-6 py-3.5 text-center">Phần thưởng</th>
                  <th className="px-6 py-3.5 text-center">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {quests.map((q) => (
                  <tr key={q.id} className="hover:bg-ink-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-ink-900">{q.title}</p>
                      <p className="text-ink-500 text-xs mt-0.5 max-w-sm">{q.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-bold text-xs uppercase bg-sky-50 text-brand-500 border border-sky-200">
                        {q.questType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-ink-700">
                      {q.targetAction}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-ink-800">
                      {q.targetCount} lần
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-sun-700 bg-sun-50 px-2 py-0.5 rounded border border-sun-200">
                        +{q.rewardExp} EXP
                        {q.rewardAiBonus > 0 && ` & +${q.rewardAiBonus} AI`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(q.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          q.active
                            ? "bg-brand-100 text-brand-800 hover:bg-brand-200"
                            : "bg-ink-100 text-ink-500 hover:bg-ink-200"
                        }`}
                      >
                        {q.active ? "Đang bật" : "Tắt"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(q)}
                        className="btn btn-secondary btn-sm"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuest(q.id)}
                        className="px-2.5 py-1 rounded-xl border border-danger-200 bg-danger-50 hover:bg-danger-100 text-danger-700 font-bold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Quest */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 mb-4">
              <h3 className="font-bold text-ink-900 text-base">
                {editingQuest ? "Sửa nhiệm vụ" : "Tạo nhiệm vụ mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-ink-500 hover:text-ink-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Tiêu đề nhiệm vụ</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Luyện tập với camera AI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Mô tả hướng dẫn</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hoàn thành 2 lượt chấm camera AI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Loại nhiệm vụ</label>
                  <select
                    value={questType}
                    onChange={(e) => setQuestType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200"
                  >
                    <option value="DAILY">Hàng ngày (Daily)</option>
                    <option value="WEEKLY">Hàng tuần (Weekly)</option>
                    <option value="ACHIEVEMENT">Thành tựu (Milestone)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Hành động cần làm</label>
                  <select
                    value={targetAction}
                    onChange={(e) => setTargetAction(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200"
                  >
                    <option value="COMPLETE_LESSON">Hoàn thành bài học</option>
                    <option value="PRACTICE_AI">Luyện camera AI</option>
                    <option value="SCORE_PERFECT">Đạt điểm 100%</option>
                    <option value="MAINTAIN_STREAK">Duy trì streak</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Số lần</label>
                  <input
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-ink-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Thưởng EXP</label>
                  <input
                    type="number"
                    min={0}
                    value={rewardExp}
                    onChange={(e) => setRewardExp(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-bold text-sun-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Thưởng AI</label>
                  <input
                    type="number"
                    min={0}
                    value={rewardAiBonus}
                    onChange={(e) => setRewardAiBonus(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-bold text-sky-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm cursor-pointer"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
