"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { IconVideo, IconSearch } from "@/components/ui/Icons";

interface AdminSignItem {
  id: string;
  word: string;
  meaning: string;
  topic: string;
  wordClass: string;
  cefrLevel: string;
  description?: string;
  status: string;
  videoId?: string;
  videoUrl?: string;
  directUrl?: string;
  driveFileId?: string;
  storageProvider?: string;
  regionLabel?: string;
  signerLabel?: string;
  durationMs?: number;
}

interface SignListResponse {
  items: AdminSignItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

const WORD_CLASSES = [
  { value: "NOUN", label: "Danh từ" },
  { value: "VERB", label: "Động từ" },
  { value: "ADJECTIVE", label: "Tính từ" },
  { value: "PRONOUN", label: "Đại từ / Xưng hô" },
  { value: "GREETING", label: "Chào hỏi / Xã giao" },
  { value: "NUMBER", label: "Số đếm" },
  { value: "ALPHABET", label: "Bảng chữ cái" },
  { value: "OTHER", label: "Khác" },
];

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const REGIONS = ["Toàn quốc", "Miền Bắc", "Miền Trung", "Miền Nam"];

export default function AdminSignsPage() {
  const [signs, setSigns] = useState<AdminSignItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  // Modal Video Preview
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string; driveId?: string } | null>(null);

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingSign, setEditingSign] = useState<AdminSignItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [formWord, setFormWord] = useState("");
  const [formMeaning, setFormMeaning] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formWordClass, setFormWordClass] = useState("NOUN");
  const [formCefrLevel, setFormCefrLevel] = useState("A1");
  const [formStatus, setFormStatus] = useState("PUBLISHED");
  const [formDirectUrl, setFormDirectUrl] = useState("");
  const [formDriveFileId, setFormDriveFileId] = useState("");
  const [formRegionLabel, setFormRegionLabel] = useState("Toàn quốc");
  const [formSignerLabel, setFormSignerLabel] = useState("Giảng viên VSL");

  const fetchSigns = async (page = 0, searchVal = search, topicVal = selectedTopic) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: "12",
      });
      if (searchVal.trim()) params.set("search", searchVal.trim());
      if (topicVal.trim()) params.set("topic", topicVal.trim());

      const res = await apiCall<SignListResponse>(`/api/v1/admin/signs?${params.toString()}`);
      if (res) {
        setSigns(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
        setCurrentPage(res.currentPage || 0);
      }
    } catch (err: any) {
      setMessage({ text: err?.errorMessage || "Không thể tải danh sách ký hiệu.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await apiCall<string[]>("/api/v1/admin/signs/topics");
      if (res && Array.isArray(res)) {
        setTopics(res);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSigns(0);
    fetchTopics();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSigns(0, search, selectedTopic);
  };

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    fetchSigns(0, search, topic);
  };

  const openAddModal = () => {
    setEditingSign(null);
    setFormWord("");
    setFormMeaning("");
    setFormDescription("");
    setFormTopic(topics[0] || "Giao tiếp cơ bản");
    setFormWordClass("NOUN");
    setFormCefrLevel("A1");
    setFormStatus("PUBLISHED");
    setFormDirectUrl("");
    setFormDriveFileId("");
    setFormRegionLabel("Toàn quốc");
    setFormSignerLabel("Giảng viên VSL");
    setShowModal(true);
  };

  const openEditModal = (item: AdminSignItem) => {
    setEditingSign(item);
    setFormWord(item.word || "");
    setFormMeaning(item.meaning || "");
    setFormDescription(item.description || "");
    setFormTopic(item.topic || "Giao tiếp cơ bản");
    setFormWordClass(item.wordClass || "NOUN");
    setFormCefrLevel(item.cefrLevel || "A1");
    setFormStatus(item.status || "PUBLISHED");
    setFormDirectUrl(item.directUrl || "");
    setFormDriveFileId(item.driveFileId || "");
    setFormRegionLabel(item.regionLabel || "Toàn quốc");
    setFormSignerLabel(item.signerLabel || "Giảng viên VSL");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      word: formWord,
      meaning: formMeaning,
      description: formDescription,
      topic: formTopic,
      wordClass: formWordClass,
      cefrLevel: formCefrLevel,
      status: formStatus,
      directUrl: formDirectUrl,
      driveFileId: formDriveFileId,
      regionLabel: formRegionLabel,
      signerLabel: formSignerLabel,
    };

    try {
      if (editingSign) {
        await apiCall(`/api/v1/admin/signs/${editingSign.id}`, {
          method: "PUT",
          body: payload,
        });
        setMessage({ text: `Đã cập nhật ký hiệu và video "${formWord}" thành công!`, type: "success" });
      } else {
        await apiCall("/api/v1/admin/signs", {
          method: "POST",
          body: payload,
        });
        setMessage({ text: `Đã thêm mới ký hiệu và video "${formWord}" thành công!`, type: "success" });
      }
      setShowModal(false);
      fetchSigns(currentPage);
      fetchTopics();
    } catch (err: any) {
      setMessage({ text: "Lỗi khi lưu: " + (err?.errorMessage || "Có lỗi xảy ra."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AdminSignItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ký hiệu "${item.word}" và toàn bộ video liên quan không?`)) return;
    try {
      await apiCall(`/api/v1/admin/signs/${item.id}`, { method: "DELETE" });
      setMessage({ text: `Đã xóa ký hiệu "${item.word}" thành công!`, type: "success" });
      fetchSigns(currentPage);
    } catch (err: any) {
      setMessage({ text: "Không thể xóa: " + (err?.errorMessage || "Có lỗi xảy ra."), type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <IconVideo className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Kho dữ liệu VSL</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Quản lý Video Học & Định nghĩa</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Quản trị từng video ký hiệu đi cùng với từng định nghĩa ý nghĩa, mô tả cử chỉ, vùng miền và cấp độ.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary btn-sm self-start sm:self-auto cursor-pointer"
        >
          <span>+</span> Thêm Video & Ký hiệu mới
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-150 ${
            message.type === "success"
              ? "bg-brand-50 text-brand-800 border border-brand-200"
              : "bg-danger-50 text-danger-800 border border-danger-200"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-ink-500 hover:text-ink-700 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Stats Summary & Filters */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Topic Selector */}
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo từ ngữ (VD: Anh, Cảm ơn, Ăn...) hoặc định nghĩa..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-ink-200 text-xs font-medium focus:outline-brand-500"
            />
          </div>

          <select
            value={selectedTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="p-2 rounded-xl border border-ink-200 text-xs font-semibold text-ink-700 bg-white"
          >
            <option value="">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-secondary btn-sm cursor-pointer">
            Tìm
          </button>
        </form>

        {/* Counter */}
        <div className="flex items-center gap-3 text-xs text-ink-500 shrink-0">
          <span>Tổng số: <strong className="text-ink-900">{totalElements}</strong> ký hiệu</span>
          <span>&bull;</span>
          <span>Trang <strong className="text-ink-900">{currentPage + 1}</strong> / {totalPages || 1}</span>
        </div>
      </div>

      {/* Grid of Signs */}
      {loading ? (
        <div className="p-16 text-center text-sm font-medium text-ink-500 animate-pulse">
          Đang tải dữ liệu video và định nghĩa...
        </div>
      ) : signs.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-ink-300">
          <span className="text-3xl block mb-2">📹</span>
          <p className="text-base font-bold text-ink-800">Không tìm thấy video ký hiệu nào</p>
          <p className="text-xs text-ink-500 mt-1">Thử đổi từ khóa tìm kiếm hoặc bấm nút thêm mới ở trên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signs.map((item) => (
            <div
              key={item.id}
              className="card overflow-hidden hover:border-ink-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Video Preview Box */}
                <div className="relative aspect-video w-full bg-ink-950 flex items-center justify-center overflow-hidden group">
                  {item.videoUrl ? (
                    <>
                      <video
                        src={item.videoUrl}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setPreviewVideo({ url: item.videoUrl!, title: item.word, driveId: item.driveFileId })}
                          className="px-3 py-1.5 rounded-full bg-white/90 text-brand-600 font-bold text-xs shadow-md hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>▶</span> Xem trước video
                        </button>
                      </div>
                    </>
                  ) : item.driveFileId ? (
                    <div className="p-4 text-center">
                      <span className="text-2xl block mb-1">📁</span>
                      <p className="text-xs font-semibold text-white/80">Google Drive: {item.driveFileId.slice(0, 12)}...</p>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideo({
                            url: `https://drive.google.com/file/d/${item.driveFileId}/preview`,
                            title: item.word,
                            driveId: item.driveFileId,
                          })
                        }
                        className="mt-2 px-2.5 py-1 rounded bg-brand-500 text-white text-[11px] font-bold"
                      >
                        Phát qua Drive ↗
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-ink-400">
                      <span className="text-2xl block mb-1">⚠️</span>
                      <p className="text-xs font-medium">Chưa có video học</p>
                    </div>
                  )}

                  {/* Region & Level Badges over Video */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/70 text-white backdrop-blur-xs">
                      {item.cefrLevel || "A1"}
                    </span>
                    {item.regionLabel && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-500/80 text-white backdrop-blur-xs">
                        {item.regionLabel}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        item.status === "PUBLISHED" ? "bg-brand-500 text-white" : "bg-sun-500 text-white"
                      }`}
                    >
                      {item.status === "PUBLISHED" ? "Xuất bản" : "Bản nháp"}
                    </span>
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-ink-900 leading-tight">{item.word}</h3>
                      <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {WORD_CLASSES.find((w) => w.value === item.wordClass)?.label || item.wordClass || "Từ ký hiệu"}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full shrink-0">
                      {item.topic}
                    </span>
                  </div>

                  {/* Definition / Meaning */}
                  <div className="bg-ink-50 p-2.5 rounded-xl border border-ink-100">
                    <p className="text-xs font-bold text-ink-800">
                      Định nghĩa: <span className="font-medium text-ink-700">{item.meaning || "Chưa có định nghĩa"}</span>
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-ink-500 mt-1 line-clamp-2 leading-relaxed">
                        Cử chỉ: {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-ink-100 bg-ink-50/50 flex items-center justify-between">
                <span className="text-[11px] text-ink-400">
                  {item.signerLabel || "Giảng viên VSL"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="btn btn-secondary btn-sm cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={currentPage === 0 || loading}
            onClick={() => fetchSigns(currentPage - 1)}
            className="btn btn-secondary btn-sm disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            &larr; Trang trước
          </button>
          <span className="px-4 text-xs font-bold text-ink-700">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages - 1 || loading}
            onClick={() => fetchSigns(currentPage + 1)}
            className="btn btn-secondary btn-sm disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            Trang sau &rarr;
          </button>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-4 bg-ink-950 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>📹</span> Video ký hiệu: <span className="text-brand-400 font-extrabold">{previewVideo.title}</span>
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
              <SignVideoPlayer
                videoUrl={previewVideo.url}
                driveFileId={previewVideo.driveId}
                title={previewVideo.title}
                autoPlay={true}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-white/60">
              <span className="truncate max-w-md">{previewVideo.url}</span>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3 mb-4">
              <h3 className="font-bold text-ink-900 text-base">
                {editingSign ? `Chỉnh sửa video & định nghĩa "${editingSign.word}"` : "Thêm Video & Ký hiệu mới"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-ink-400 hover:text-ink-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Row 1: Word & Meaning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink-800 mb-1">
                    Từ ngữ ký hiệu <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Xin chào, Cảm ơn, Gia đình..."
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-bold text-ink-900 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink-800 mb-1">
                    Định nghĩa / Ý nghĩa <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Lời chào hỏi thông dụng khi gặp mặt..."
                    value={formMeaning}
                    onChange={(e) => setFormMeaning(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-medium text-ink-800 focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-ink-800 mb-1">
                  Mô tả / Hướng dẫn cách làm ký hiệu
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chuyển động bàn tay, vị trí đặt tay, biểu cảm khuôn mặt..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-ink-200 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Row 2: Topic & Word Class & CEFR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ink-800 mb-1">Chủ đề (Topic)</label>
                  <input
                    type="text"
                    required
                    list="topic-suggestions"
                    placeholder="Gia đình, Giao tiếp..."
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-semibold"
                  />
                  <datalist id="topic-suggestions">
                    {topics.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-ink-800 mb-1">Từ loại</label>
                  <select
                    value={formWordClass}
                    onChange={(e) => setFormWordClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-medium"
                  >
                    {WORD_CLASSES.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink-800 mb-1">Cấp độ CEFR</label>
                  <select
                    value={formCefrLevel}
                    onChange={(e) => setFormCefrLevel(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-bold"
                  >
                    {CEFR_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Cấp độ {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video Info Section */}
              <div className="pt-3 border-t border-ink-100 space-y-3">
                <h4 className="font-bold text-ink-900 text-xs flex items-center gap-1.5">
                  <IconVideo className="h-4 w-4 text-brand-600" />
                  <span>Thông tin Video học đi kèm</span>
                </h4>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">
                    Liên kết Video trực tiếp (Direct Video URL hoặc Google Drive Link)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/... hoặc URL .mp4 trực tiếp"
                    value={formDirectUrl}
                    onChange={(e) => setFormDirectUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-mono text-[11px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-ink-700 mb-1">Google Drive File ID</label>
                    <input
                      type="text"
                      placeholder="1UmlQdmgSnoWL..."
                      value={formDriveFileId}
                      onChange={(e) => setFormDriveFileId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-ink-200 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 mb-1">Vùng miền ký hiệu</label>
                    <select
                      value={formRegionLabel}
                      onChange={(e) => setFormRegionLabel(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-ink-200"
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-ink-700 mb-1">Người thực hiện</label>
                    <input
                      type="text"
                      placeholder="Người ký hiệu 001"
                      value={formSignerLabel}
                      onChange={(e) => setFormSignerLabel(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-ink-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink-700 mb-1">Trạng thái xuất bản</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-ink-200 font-bold"
                  >
                    <option value="PUBLISHED">PUBLISHED (Đã duyệt, hiển thị trong bài học & từ điển)</option>
                    <option value="DRAFT">DRAFT (Bản nháp nội bộ)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={saving}
                  className="btn btn-primary btn-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editingSign ? "Cập nhật Ký hiệu & Video" : "Tạo Ký hiệu & Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
