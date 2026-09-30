"use client";

import { useEffect, useState, useMemo } from "react";
import { apiCall, ApiError } from "@/lib/api";
import { IconArticle, IconSearch, IconTag } from "@/components/ui/Icons";

interface ArticleItem {
  id: string;
  slug: string;
  titleVi: string;
  titleEn: string;
  excerptVi: string;
  excerptEn: string;
  contentVi: string;
  contentEn: string;
  author: string;
  category: string;
  categoryLabelVi: string;
  categoryLabelEn: string;
  tags: string[];
  thumbnailUrl?: string;
  readTimeVi: string;
  readTimeEn: string;
  published: boolean;
  viewsCount: number;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
}

interface TagInfo {
  name: string;
  count: number;
}

const CATEGORIES = [
  { id: "tips", labelVi: "Mẹo học tập", labelEn: "Learning Tips", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "culture", labelVi: "Văn hoá Người Điếc", labelEn: "Deaf Culture", color: "bg-sun-50 text-sun-800 border-sun-200" },
  { id: "tech", labelVi: "Công nghệ AI", labelEn: "AI Technology", color: "bg-brand-50 text-brand-700 border-brand-200" },
  { id: "community", labelVi: "Cộng đồng & Xã hội", labelEn: "Community", color: "bg-grape-50 text-grape-700 border-grape-200" },
];

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [modalForm, setModalForm] = useState({
    slug: "",
    titleVi: "",
    titleEn: "",
    excerptVi: "",
    excerptEn: "",
    contentVi: "",
    contentEn: "",
    author: "Đội ngũ Giáo dục SignLight",
    category: "tips",
    categoryLabelVi: "Mẹo học tập",
    categoryLabelEn: "Learning Tips",
    tags: [] as string[],
    readTimeVi: "5 phút đọc",
    readTimeEn: "5 min read",
    thumbnailUrl: "",
    published: true,
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchArticlesAndTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const [articlesData, tagsData] = await Promise.all([
        apiCall<ArticleItem[]>("/api/v1/admin/articles"),
        apiCall<TagInfo[]>("/api/v1/admin/articles/tags"),
      ]);
      setArticles(articlesData || []);
      setTags(tagsData || []);
    } catch (err: any) {
      setError(err?.errorMessage || "Không thể tải danh sách bài viết. Vui lòng kiểm tra quyền Admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticlesAndTags();
  }, []);

  // Filtered List
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      // Search
      const matchSearch =
        !search.trim() ||
        a.titleVi.toLowerCase().includes(search.toLowerCase()) ||
        (a.titleEn && a.titleEn.toLowerCase().includes(search.toLowerCase())) ||
        (a.author && a.author.toLowerCase().includes(search.toLowerCase())) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      // Category
      const matchCat = selectedCategory === "all" || a.category === selectedCategory;

      // Tag
      const matchTag = !selectedTag || a.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

      // Status
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "published" && a.published) ||
        (filterStatus === "draft" && !a.published);

      return matchSearch && matchCat && matchTag && matchStatus;
    });
  }, [articles, search, selectedCategory, selectedTag, filterStatus]);

  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setModalForm({
      slug: "",
      titleVi: "",
      titleEn: "",
      excerptVi: "",
      excerptEn: "",
      contentVi: "",
      contentEn: "",
      author: "Đội ngũ Giáo dục SignLight",
      category: "tips",
      categoryLabelVi: "Mẹo học tập",
      categoryLabelEn: "Learning Tips",
      tags: ["VSL", "Mẹo học"],
      readTimeVi: "5 phút đọc",
      readTimeEn: "5 min read",
      thumbnailUrl: "",
      published: true,
    });
    setTagInput("");
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (article: ArticleItem) => {
    setEditingArticle(article);
    setModalForm({
      slug: article.slug,
      titleVi: article.titleVi,
      titleEn: article.titleEn || "",
      excerptVi: article.excerptVi || "",
      excerptEn: article.excerptEn || "",
      contentVi: article.contentVi || "",
      contentEn: article.contentEn || "",
      author: article.author || "Đội ngũ SignLight",
      category: article.category,
      categoryLabelVi: article.categoryLabelVi || "",
      categoryLabelEn: article.categoryLabelEn || "",
      tags: [...article.tags],
      readTimeVi: article.readTimeVi || "5 phút đọc",
      readTimeEn: article.readTimeEn || "5 min read",
      thumbnailUrl: article.thumbnailUrl || "",
      published: article.published,
    });
    setTagInput("");
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !modalForm.tags.includes(trimmed)) {
      setModalForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setModalForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleCategoryChange = (catId: string) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    setModalForm((prev) => ({
      ...prev,
      category: catId,
      categoryLabelVi: found?.labelVi || catId,
      categoryLabelEn: found?.labelEn || catId,
    }));
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.titleVi.trim()) {
      setActionError("Vui lòng nhập tiêu đề tiếng Việt");
      return;
    }

    setSaving(true);
    setActionError(null);

    try {
      if (editingArticle) {
        // Update
        await apiCall(`/api/v1/admin/articles/${editingArticle.id}`, {
          method: "PUT",
          body: modalForm,
        });
      } else {
        // Create
        await apiCall("/api/v1/admin/articles", {
          method: "POST",
          body: modalForm,
        });
      }
      setIsModalOpen(false);
      await fetchArticlesAndTags();
    } catch (err: any) {
      setActionError(err?.errorMessage || "Không thể lưu bài viết. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (id: string, current: boolean) => {
    try {
      await apiCall(`/api/v1/admin/articles/${id}/toggle-published`, { method: "PATCH" });
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, published: !current } : a))
      );
    } catch (err: any) {
      alert(err?.errorMessage || "Không thể thay đổi trạng thái xuất bản");
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await apiCall(`/api/v1/admin/articles/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      // Refresh tags
      const updatedTags = await apiCall<TagInfo[]>("/api/v1/admin/articles/tags");
      setTags(updatedTags || []);
    } catch (err: any) {
      alert(err?.errorMessage || "Không thể xóa bài viết");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 flex items-center gap-2">
            <IconArticle className="h-7 w-7 text-brand-600" /> Quản trị Bài viết & Tags
          </h1>
          <p className="text-sm text-ink-600 mt-1">
            Biên tập bài viết cẩm nang, hướng dẫn VSL và quản lý hệ thống phân loại tags
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn btn-primary self-start sm:self-auto cursor-pointer"
        >
          + Thêm bài viết mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-ink-500 uppercase">Tổng bài viết</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{articles.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-success-500">
          <p className="text-xs font-semibold text-ink-500 uppercase">Đã xuất bản</p>
          <p className="mt-1 text-2xl font-bold text-success-600">
            {articles.filter((a) => a.published).length}
          </p>
        </div>
        <div className="card p-4 border-l-4 border-l-sun-500">
          <p className="text-xs font-semibold text-ink-500 uppercase">Bản nháp</p>
          <p className="mt-1 text-2xl font-bold text-sun-600">
            {articles.filter((a) => !a.published).length}
          </p>
        </div>
        <div className="card p-4 border-l-4 border-l-brand-500">
          <p className="text-xs font-semibold text-ink-500 uppercase">Tổng số Tags</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{tags.length}</p>
        </div>
      </div>

      {/* Tags Cloud / Management Bar */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-700 uppercase tracking-wider">
            <IconTag className="h-4 w-4 text-brand-500" />
            Hệ thống Tags ({tags.length})
          </div>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-brand-600 font-semibold hover:underline cursor-pointer"
            >
              Bỏ lọc tag (đang chọn: #{selectedTag}) ✕
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((t) => {
            const isSelected = selectedTag?.toLowerCase() === t.name.toLowerCase();
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : t.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-ink-50 text-ink-700 border-ink-200 hover:border-brand-300 hover:bg-brand-50"
                }`}
              >
                <span>#{t.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-ink-200 text-ink-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, tác giả hoặc tag..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-ink-200 text-sm bg-white font-medium text-ink-700 focus:outline-none"
          >
            <option value="all">Tất cả chuyên mục</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.labelVi}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-ink-200 text-sm bg-white font-medium text-ink-700 focus:outline-none"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      {loading ? (
        <div className="card p-8 text-center text-ink-500 text-sm animate-pulse">
          Đang tải dữ liệu bài viết...
        </div>
      ) : error ? (
        <div className="card p-6 bg-danger-50 border-danger-200 text-danger-800 text-sm">
          {error}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card p-12 text-center text-ink-500 space-y-3">
          <p className="text-3xl">📝</p>
          <p className="font-semibold text-ink-800">Không tìm thấy bài viết nào phù hợp</p>
          <p className="text-xs text-ink-500">Thử xoá bộ lọc hoặc tạo bài viết mới</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50 text-xs font-bold uppercase text-ink-500 border-b border-ink-200">
                <tr>
                  <th className="px-5 py-3.5">Tiêu đề bài viết</th>
                  <th className="px-4 py-3.5">Chuyên mục</th>
                  <th className="px-4 py-3.5">Tags</th>
                  <th className="px-4 py-3.5">Tác giả</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredArticles.map((a) => {
                  const cat = CATEGORIES.find((c) => c.id === a.category);
                  return (
                    <tr key={a.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-5 py-4 max-w-sm">
                        <p className="font-bold text-ink-900 line-clamp-1">{a.titleVi}</p>
                        {a.titleEn && <p className="text-xs text-ink-500 line-clamp-1 mt-0.5">{a.titleEn}</p>}
                        <p className="text-[11px] text-ink-400 font-mono mt-1">slug: /{a.slug}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            cat?.color || "bg-ink-100 text-ink-700 border-ink-200"
                          }`}
                        >
                          {a.categoryLabelVi || a.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {a.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[11px] font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-ink-700">
                        {a.author}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublished(a.id, a.published)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            a.published
                              ? "bg-success-100 text-success-700 hover:bg-success-200"
                              : "bg-ink-200 text-ink-600 hover:bg-ink-300"
                          }`}
                        >
                          {a.published ? "✓ Đã xuất bản" : "Bản nháp"}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(a)}
                          className="px-3 py-1.5 rounded-lg bg-ink-100 text-ink-800 hover:bg-brand-50 hover:text-brand-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(a.id, a.titleVi)}
                          className="px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 hover:bg-danger-100 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-ink-200">
              <h2 className="text-xl font-bold text-ink-900">
                {editingArticle ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-ink-500 hover:text-ink-900 hover:bg-ink-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="p-3 my-4 bg-danger-50 border border-danger-200 rounded-xl text-xs font-semibold text-danger-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSaveArticle} className="space-y-4 pt-4">
              {/* Tiêu đề */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">
                    Tiêu đề (Tiếng Việt) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.titleVi}
                    onChange={(e) => setModalForm({ ...modalForm, titleVi: e.target.value })}
                    placeholder="VD: 5 Lý do học Ngôn ngữ Ký hiệu..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">Tiêu đề (Tiếng Anh)</label>
                  <input
                    type="text"
                    value={modalForm.titleEn}
                    onChange={(e) => setModalForm({ ...modalForm, titleEn: e.target.value })}
                    placeholder="VD: 5 Reasons to Learn VSL..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Slug & Tác giả */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">
                    Đường dẫn tĩnh (Slug) <span className="text-ink-400 font-normal">(bỏ trống tự tạo)</span>
                  </label>
                  <input
                    type="text"
                    value={modalForm.slug}
                    onChange={(e) => setModalForm({ ...modalForm, slug: e.target.value })}
                    placeholder="vd: 5-ly-do-hoc-vsl"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">Tác giả</label>
                  <input
                    type="text"
                    value={modalForm.author}
                    onChange={(e) => setModalForm({ ...modalForm, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Chuyên mục & Thời gian đọc */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">Chuyên mục</label>
                  <select
                    value={modalForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm bg-white focus:outline-none focus:border-brand-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.labelVi} ({c.labelEn})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-ink-800">Thời gian đọc</label>
                  <input
                    type="text"
                    value={modalForm.readTimeVi}
                    onChange={(e) => setModalForm({ ...modalForm, readTimeVi: e.target.value })}
                    placeholder="VD: 5 phút đọc"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                  <IconTag className="h-3.5 w-3.5 text-brand-500" /> Tags bài viết
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Nhập tên tag và nhấn Enter hoặc nút Thêm..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-brand-50 text-brand-700 font-semibold rounded-xl text-xs hover:bg-brand-100 cursor-pointer"
                  >
                    + Thêm tag
                  </button>
                </div>
                {/* Active Tags list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {modalForm.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-brand-500 hover:text-danger-600 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {modalForm.tags.length === 0 && (
                    <span className="text-xs text-ink-400 italic">Chưa có tag nào</span>
                  )}
                </div>
              </div>

              {/* Tóm tắt */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">Tóm tắt ngắn (Excerpt)</label>
                <textarea
                  rows={2}
                  value={modalForm.excerptVi}
                  onChange={(e) => setModalForm({ ...modalForm, excerptVi: e.target.value })}
                  placeholder="Mô tả ngắn gọn về nội dung bài viết..."
                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Nội dung chi tiết */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-800">Nội dung bài viết</label>
                <textarea
                  rows={5}
                  value={modalForm.contentVi}
                  onChange={(e) => setModalForm({ ...modalForm, contentVi: e.target.value })}
                  placeholder="Nhập toàn bộ nội dung bài viết ở đây..."
                  className="w-full px-3.5 py-2 rounded-xl border border-ink-200 text-sm focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              {/* Trạng thái xuất bản */}
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.published}
                    onChange={(e) => setModalForm({ ...modalForm, published: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success-600"></div>
                </label>
                <span className="text-sm font-semibold text-ink-800">
                  {modalForm.published ? "Xuất bản công khai ngay" : "Lưu dưới dạng bản nháp (Draft)"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm cursor-pointer"
                >
                  {saving ? "Đang lưu..." : editingArticle ? "Cập nhật bài viết" : "Tạo bài viết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
