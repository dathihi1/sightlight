"use client";

import { useState, useEffect, use } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";

interface ExerciseOption {
  id?: string;
  orderIndex: number;
  labelText: string;
  isCorrect: boolean;
}

interface Exercise {
  id: string;
  lessonId: string;
  orderIndex: number;
  type: string;
  skill: string;
  difficulty: string;
  promptText: string;
  instructionText: string;
  correctAnswerText: string;
  signId?: string;
  signName?: string;
  videoUrl?: string;
  options: ExerciseOption[];
}

interface ContentBlock {
  id: string;
  orderIndex: number;
  stableKey: string;
  blockType: string;
  title: string;
  bodyText: string;
  mediaRef?: string;
  isRequired: boolean;
  status: string;
}

interface LessonDetail {
  id: string;
  chapterId: string;
  title: string;
  orderIndex: number;
  type: string;
  estimatedMinutes: number;
  status: string;
  summary: string;
  topic: string;
  targetLevel: string;
  contentVersion: number;
  exercises: Exercise[];
  blocks: ContentBlock[];
}

export default function AdminLessonBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const lessonId = resolvedParams.id;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [availableSigns, setAvailableSigns] = useState<any[]>([]);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);

  // Form states for adding/editing exercise
  const [formType, setFormType] = useState("SIGN_TO_MEANING");
  const [formPrompt, setFormPrompt] = useState("");
  const [formInstruction, setFormInstruction] = useState("");
  const [formCorrectText, setFormCorrectText] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("BASIC");
  const [formSkill, setFormSkill] = useState("RECOGNITION");
  const [formSignId, setFormSignId] = useState("");
  const [formOptions, setFormOptions] = useState<ExerciseOption[]>([
    { orderIndex: 0, labelText: "", isCorrect: true },
    { orderIndex: 1, labelText: "", isCorrect: false },
    { orderIndex: 2, labelText: "", isCorrect: false },
    { orderIndex: 3, labelText: "", isCorrect: false },
  ]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await apiCall<LessonDetail>(`/api/v1/admin/lessons/${lessonId}/builder`);
      if (res) {
        setLesson(res);
        setExercises(res.exercises || []);
        setBlocks(res.blocks || []);
      }
    } catch (err: any) {
      setMessage({ text: err?.errorMessage || "Không thể tải chi tiết bài học", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
    apiCall<{ items: any[] }>("/api/v1/admin/signs?size=150")
      .then((res) => {
        if (res?.items) setAvailableSigns(res.items);
      })
      .catch(() => {});
  }, [lessonId]);

  // Reorder Exercises: Move Up / Down
  const moveExercise = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const newExercises = [...exercises];
    const temp = newExercises[index];
    newExercises[index] = newExercises[targetIndex];
    newExercises[targetIndex] = temp;

    // Update orderIndex locally for smooth UI
    newExercises.forEach((ex, idx) => {
      ex.orderIndex = idx;
    });
    setExercises(newExercises);

    // Save to Backend immediately
    setSavingOrder(true);
    try {
      await apiCall(`/api/v1/admin/lessons/${lessonId}/reorder-exercises`, {
        method: "PUT",
        body: { orderedIds: newExercises.map((e) => e.id) },
      });
      setMessage({ text: "Đã cập nhật và lưu thứ tự mới thành công!", type: "success" });
    } catch (err: any) {
      setMessage({ text: "Lỗi khi lưu thứ tự: " + err?.errorMessage, type: "error" });
      fetchLesson(); // rollback
    } finally {
      setSavingOrder(false);
    }
  };

  // Delete Exercise
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài tập này khỏi bài học không?")) return;
    try {
      await apiCall(`/api/v1/admin/exercises/${exerciseId}`, { method: "DELETE" });
      setMessage({ text: "Đã xóa bài tập thành công!", type: "success" });
      fetchLesson();
    } catch (err: any) {
      setMessage({ text: "Không thể xóa: " + err?.errorMessage, type: "error" });
    }
  };

  // Open Edit Modal
  const openEditModal = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormType(ex.type || "SIGN_TO_MEANING");
    setFormPrompt(ex.promptText || "");
    setFormInstruction(ex.instructionText || "");
    setFormCorrectText(ex.correctAnswerText || "");
    setFormDifficulty(ex.difficulty || "BASIC");
    setFormSkill(ex.skill || "RECOGNITION");
    setFormSignId(ex.signId || "");
    setFormOptions(
      ex.options && ex.options.length > 0
        ? ex.options.map((o, idx) => ({ orderIndex: idx, labelText: o.labelText, isCorrect: o.isCorrect }))
        : [
            { orderIndex: 0, labelText: "", isCorrect: true },
            { orderIndex: 1, labelText: "", isCorrect: false },
          ]
    );
    setShowAddModal(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingExercise(null);
    setFormType("SIGN_TO_MEANING");
    setFormPrompt("");
    setFormInstruction("Chọn ý nghĩa đúng tương ứng với video ký hiệu");
    setFormCorrectText("");
    setFormDifficulty("BASIC");
    setFormSkill("RECOGNITION");
    setFormSignId("");
    setFormOptions([
      { orderIndex: 0, labelText: "", isCorrect: true },
      { orderIndex: 1, labelText: "", isCorrect: false },
      { orderIndex: 2, labelText: "", isCorrect: false },
      { orderIndex: 3, labelText: "", isCorrect: false },
    ]);
    setShowAddModal(true);
  };

  // Submit Add or Edit Exercise
  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type: formType,
      skill: formSkill,
      difficulty: formDifficulty,
      promptText: formPrompt,
      instructionText: formInstruction,
      correctAnswerText: formCorrectText,
      signId: formSignId ? formSignId : undefined,
      options: formOptions.filter((o) => o.labelText.trim().length > 0),
    };

    try {
      if (editingExercise) {
        await apiCall(`/api/v1/admin/exercises/${editingExercise.id}`, {
          method: "PUT",
          body: payload,
        });
        setMessage({ text: "Đã cập nhật bài tập thành công!", type: "success" });
      } else {
        await apiCall(`/api/v1/admin/lessons/${lessonId}/exercises`, {
          method: "POST",
          body: payload,
        });
        setMessage({ text: "Đã thêm bài tập mới thành công!", type: "success" });
      }
      setShowAddModal(false);
      fetchLesson();
    } catch (err: any) {
      alert("Lỗi khi lưu: " + (err?.errorMessage || "Có lỗi xảy ra"));
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-ink-500 animate-pulse">Đang tải LMS Lesson Builder...</div>;
  }

  if (!lesson) {
    return <div className="p-12 text-center text-ink-500">Không tìm thấy bài học này.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-ink-800 transition-colors"
        >
          <span>&larr;</span> Quay lại danh sách bài học
        </Link>
        <div className="flex items-center gap-2">
          {savingOrder && (
            <span className="text-xs font-semibold text-sky-600 animate-pulse">Đang đồng bộ thứ tự...</span>
          )}
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
            message.type === "success"
              ? "bg-brand-50 text-brand-800 border border-brand-200"
              : "bg-danger-50 text-danger-800 border border-danger-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-ink-500 hover:text-ink-600">
            &times;
          </button>
        </div>
      )}

      {/* Lesson Header Card */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-sky-100 text-brand-500">
              LMS Builder
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-ink-100 text-ink-700">
              Phiên bản nội dung: v{lesson.contentVersion}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-brand-100 text-brand-800">
              {lesson.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-ink-900">{lesson.title}</h1>
          <p className="text-xs text-ink-500 mt-1 max-w-2xl">{lesson.summary || "Chưa có mô tả tóm tắt"}</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href={`/hoc/bai/${lesson.id}`}
            target="_blank"
            className="btn btn-secondary btn-sm"
          >
            Học thử bài này ↗
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary btn-sm cursor-pointer"
          >
            <span>+</span> Thêm Bài Tập
          </button>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
              <span>Trình tự các bài tập trong bài học</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-ink-100 text-ink-600">
                {exercises.length} bài tập
              </span>
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Dùng nút ⬆ / ⬇ để thay đổi thứ tự người học sẽ trải qua. Hệ thống tự động lưu vào Database.
            </p>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="card p-12 text-center border-dashed border-ink-300">
            <span className="text-3xl block mb-2">📝</span>
            <p className="text-sm font-bold text-ink-700">Chưa có bài tập nào trong bài này</p>
            <p className="text-xs text-ink-500 mt-1">Bấm nút “Thêm Bài Tập” ở trên để tạo bài đầu tiên.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="card p-4 sm:p-5 hover:border-ink-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Order index & info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-ink-100 border border-ink-200">
                    <span className="text-xs font-semibold text-ink-500 leading-none">BƯỚC</span>
                    <span className="text-sm font-bold text-ink-800 leading-tight">#{idx + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-sky-50 text-brand-500 border border-sky-200">
                        {ex.type}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-ink-100 text-ink-600">
                        {ex.difficulty}
                      </span>
                      {ex.signName && (
                        <span className="text-xs font-bold text-ink-700 bg-sun-50 border border-sun-200 px-2 py-0.5 rounded">
                          Ký hiệu: <strong>{ex.signName}</strong>
                        </span>
                      )}
                      {ex.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewVideo({ url: ex.videoUrl!, title: ex.signName || ex.promptText })}
                          className="px-2 py-0.5 rounded text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>▶</span> Video học
                        </button>
                      )}
                    </div>

                    <p className="text-sm font-bold text-ink-900 line-clamp-1">
                      {ex.promptText || ex.instructionText || "Bài tập thực hành VSL"}
                    </p>

                    {/* Options Preview */}
                    {ex.options && ex.options.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {ex.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              opt.isCorrect
                                ? "bg-brand-100 text-brand-800 border border-brand-200 font-bold"
                                : "bg-ink-50 text-ink-600 border border-ink-200"
                            }`}
                          >
                            {opt.isCorrect ? "✓ " : ""}{opt.labelText}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Action Buttons (Reorder, Edit, Delete) */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-ink-100 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={idx === 0 || savingOrder}
                    onClick={() => moveExercise(idx, "up")}
                    title="Di chuyển lên trên"
                    className="p-2 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    ⬆
                  </button>
                  <button
                    type="button"
                    disabled={idx === exercises.length - 1 || savingOrder}
                    onClick={() => moveExercise(idx, "down")}
                    title="Di chuyển xuống dưới"
                    className="p-2 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    ⬇
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(ex)}
                    title="Chỉnh sửa nội dung"
                    className="btn btn-secondary btn-sm cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(ex.id)}
                    title="Xóa bài tập"
                    className="px-3 py-1.5 rounded-xl border border-danger-200 bg-danger-50 hover:bg-danger-100 text-xs font-bold text-danger-700 transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Blocks Section */}
      <div className="mt-8 pt-8 border-t border-ink-200 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900 flex items-center gap-2">
            <span>Các khối dẫn dắt & Mẹo bài học (Content Blocks)</span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-ink-100 text-ink-600">
              {blocks.length} khối
            </span>
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Các đoạn văn, giải thích văn hóa Điếc, mẹo ghi nhớ được đọc trước hoặc sau bài tập.
          </p>
        </div>

        <div className="space-y-2">
          {blocks.map((b, idx) => (
            <div
              key={b.id}
              className="p-3.5 bg-white rounded-xl border border-ink-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-ink-500">#{idx + 1}</span>
                <span className="px-2 py-0.5 rounded font-bold text-xs uppercase bg-sun-100 text-sun-800">
                  {b.blockType}
                </span>
                <span className="font-bold text-ink-900">{b.title || "Khối nội dung"}</span>
                <span className="text-ink-500 line-clamp-1 max-w-xs">{b.bodyText}</span>
              </div>
              <span className="text-xs font-bold text-brand-600 uppercase">{b.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 mb-4">
              <h3 className="font-bold text-ink-900 text-base">
                {editingExercise ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-ink-500 hover:text-ink-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink-700 mb-1">Dạng bài tập</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="btn btn-secondary w-full"
                >
                  <option value="SIGN_TO_MEANING">Ký hiệu &rarr; Nghĩa (Nhìn video chọn chữ)</option>
                  <option value="MEANING_TO_SIGN">Nghĩa &rarr; Ký hiệu (Nhìn chữ chọn video)</option>
                  <option value="TYPE_WHAT_YOU_SEE">Gõ phím từ ngữ bạn nhìn thấy</option>
                  <option value="SENTENCE_ORDER">Sắp xếp câu ký hiệu theo thứ tự đúng</option>
                  <option value="MATCH_SIGN_MEANING">Nối cặp từ và ký hiệu</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">
                  Ký hiệu & Video học gắn kèm (Tùy chọn)
                </label>
                <select
                  value={formSignId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setFormSignId(selectedId);
                    const sign = availableSigns.find((s) => s.id === selectedId);
                    if (sign) {
                      if (!formPrompt) setFormPrompt(`Ký hiệu "${sign.word}" có ý nghĩa là gì?`);
                      if (!formCorrectText) setFormCorrectText(sign.meaning || sign.word);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-ink-200 bg-white"
                >
                  <option value="">-- Không gắn ký hiệu riêng (Bài tập câu hoặc ngữ cảnh) --</option>
                  {availableSigns.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.word} ({s.topic}) - {s.meaning ? s.meaning.slice(0, 40) + "..." : "Chưa có định nghĩa"}
                    </option>
                  ))}
                </select>

                {formSignId && (
                  <div className="mt-2 p-2.5 rounded-xl bg-ink-50 border border-ink-200 space-y-1">
                    {(() => {
                      const s = availableSigns.find((x) => x.id === formSignId);
                      if (!s) return null;
                      return (
                        <>
                          <p className="font-bold text-ink-900">
                            Ký hiệu: <span className="text-brand-600">{s.word}</span> &bull; Cấp độ: {s.cefrLevel || "A1"}
                          </p>
                          <p className="text-ink-600">
                            <strong>Định nghĩa:</strong> {s.meaning || "Chưa có"}
                          </p>
                          {s.videoUrl ? (
                            <p className="text-brand-600 font-bold flex items-center gap-1">
                              <span>📹</span> Có video học sẵn sàng
                            </p>
                          ) : (
                            <p className="text-sun-600 font-medium">⚠️ Ký hiệu này chưa có video trong kho</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Câu hỏi / Lời nhắc (Prompt)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Ký hiệu này biểu thị điều gì?"
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-ink-700 mb-1">Hướng dẫn trước bài tập</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quan sát kỹ chuyển động ngón tay..."
                  value={formInstruction}
                  onChange={(e) => setFormInstruction(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Độ khó</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200"
                  >
                    <option value="INTRO">Nhập môn (Intro)</option>
                    <option value="BASIC">Cơ bản (Basic)</option>
                    <option value="INTERMEDIATE">Trung bình</option>
                    <option value="CHALLENGE">Thử thách</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-ink-700 mb-1">Kỹ năng</label>
                  <select
                    value={formSkill}
                    onChange={(e) => setFormSkill(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200"
                  >
                    <option value="RECOGNITION">Nhận diện (Recognition)</option>
                    <option value="RECALL">Gợi nhớ (Recall)</option>
                    <option value="PRODUCTION">Thực hành (Production)</option>
                    <option value="ORDERING">Sắp xếp câu (Ordering)</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="border-t border-ink-100 pt-3">
                <label className="block font-bold text-ink-700 mb-2">Các đáp án lựa chọn (Tích tròn đáp án đúng):</label>
                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={opt.isCorrect}
                        onChange={() => {
                          const updated = formOptions.map((o, i) => ({
                            ...o,
                            isCorrect: i === idx,
                          }));
                          setFormOptions(updated);
                        }}
                        className="w-4 h-4 text-brand-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        placeholder={`Đáp án ${idx + 1}`}
                        value={opt.labelText}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx].labelText = e.target.value;
                          setFormOptions(updated);
                        }}
                        className={`flex-1 p-2 rounded-xl border text-xs ${
                          opt.isCorrect ? "border-brand-400 bg-brand-50/30 font-bold" : "border-ink-200"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm cursor-pointer"
                >
                  Lưu bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-4 bg-ink-950 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-bold text-base text-white">
                Video học: <span className="text-brand-400">{previewVideo.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="text-white/60 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <SignVideoPlayer videoUrl={previewVideo.url} title={previewVideo.title} autoPlay={true} />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="btn btn-secondary btn-sm bg-white/10 text-white hover:bg-white/20"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
