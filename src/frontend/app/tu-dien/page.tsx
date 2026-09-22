"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SignVideoPlayer } from "@/components/SignVideoPlayer";
import { apiCall } from "@/lib/api";

interface SearchResult {
  items: SignItem[];
  totalElements: number;
  totalPages: number;
}

interface SignItem {
  id: string;
  word: string;
  meaning: string | null;
  topic: string | null;
  wordClass: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  aiRecognizable: boolean;
}

interface VariantItem {
  id: string;
  videoUrl: string | null;
  placeholderVideo: boolean;
  regionLabel: string | null;
  signerLabel: string | null;
  primary: boolean;
}

interface SignDetail {
  id: string;
  word: string;
  meaning: string | null;
  wordClass: string | null;
  topic: string | null;
  description: string | null;
  aiRecognizable: boolean;
  variants: VariantItem[];
}

/** SCR-17 — từ điển ký hiệu (FR-21, FR-22). Hỗ trợ tìm kiếm và phát video mẫu trực tiếp. */
export default function DictionaryPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  const search = useQuery({
    queryKey: ["dictionary", query],
    enabled: query.trim().length > 0,
    queryFn: () =>
      apiCall<SearchResult>(`/api/v1/dictionary/search?q=${encodeURIComponent(query)}`, {
        auth: false,
      }),
  });

  const signDetail = useQuery({
    queryKey: ["signDetail", selectedSignId],
    enabled: Boolean(selectedSignId),
    queryFn: () =>
      apiCall<SignDetail>(`/api/v1/dictionary/signs/${selectedSignId}`, {
        auth: false,
      }),
  });

  useEffect(() => {
    setActiveVariantIndex(0);
  }, [selectedSignId]);

  // Đóng modal khi nhấn ESC
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedSignId(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const variants = signDetail.data?.variants ?? [];
  const activeVariant = variants[activeVariantIndex] ?? variants[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Từ điển ký hiệu VSL-400</h1>
        <p className="text-sm text-[var(--color-ink-600)]">
          Tra cứu hơn 400 từ vựng ký hiệu chuẩn kèm video hướng dẫn thực tế theo vùng miền. Gõ có dấu hay không dấu đều được.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(input);
        }}
        className="flex gap-2"
        role="search"
      >
        <label htmlFor="q" className="sr-only">
          Từ cần tra
        </label>
        <input
          id="q"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập từ cần tra (vd: Anh, Cảm ơn, Cái bàn)..."
          className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#0d9fa5] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#08757a] transition-colors"
        >
          Tra cứu
        </button>
      </form>

      {search.isError && <ErrorNotice message="Không tra cứu được, vui lòng thử lại." />}
      {search.isLoading && query && <p className="text-[var(--color-ink-600)]">Đang tìm kiếm...</p>}

      {search.data && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-ink-600)]">
            Tìm thấy {search.data.totalElements} kết quả cho &ldquo;{query}&rdquo;
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {search.data.items.map((sign) => (
              <li
                key={sign.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#E2DBD0] bg-white p-5 shadow-sm transition-all hover:border-[#0d9fa5] hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#0d9fa5] transition-colors">
                      {sign.word}
                    </h3>
                    {sign.aiRecognizable && (
                      <span className="shrink-0 rounded-full bg-[#e6f7f8] border border-[#b2e7e9] px-2.5 py-0.5 text-xs font-semibold text-[#08757a]">
                        Chấm AI
                      </span>
                    )}
                  </div>

                  {sign.meaning && (
                    <p className="text-sm text-[#475569] line-clamp-2">{sign.meaning}</p>
                  )}

                  {sign.topic && (
                    <p className="text-xs text-[#64748B]">Chủ đề: {sign.topic}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">
                    {sign.wordClass ? `Từ loại: ${sign.wordClass}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedSignId(sign.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f7f8] px-3 py-1.5 text-xs font-bold text-[#08757a] hover:bg-[#0d9fa5] hover:text-white transition-colors"
                  >
                    <span>▶</span>
                    <span>Xem video</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {search.data.items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] p-8 text-center">
              <p className="text-[#64748B]">
                Chưa có ký hiệu nào khớp với từ khóa. Bạn có thể thử tìm từ khác hoặc liên hệ để bổ sung.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Modal phát video ký hiệu */}
      {selectedSignId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedSignId(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#E2DBD0] space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setSelectedSignId(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Đóng"
            >
              ✕
            </button>

            {signDetail.isLoading && (
              <div className="flex h-64 items-center justify-center">
                <p className="text-sm text-[#64748B]">Đang tải video ký hiệu...</p>
              </div>
            )}

            {signDetail.isError && (
              <div className="p-4">
                <ErrorNotice message="Không tải được video cho ký hiệu này." />
              </div>
            )}

            {signDetail.data && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-[#0F172A]">{signDetail.data.word}</h2>
                    {signDetail.data.wordClass && (
                      <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">
                        {signDetail.data.wordClass}
                      </span>
                    )}
                  </div>
                  {signDetail.data.meaning && (
                    <p className="text-sm text-[#475569] mt-1">{signDetail.data.meaning}</p>
                  )}
                </div>

                {/* Bộ chọn biến thể vùng miền nếu có nhiều video */}
                {variants.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-semibold text-[#64748B]">Biến thể:</span>
                    {variants.map((v, idx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVariantIndex(idx)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          idx === activeVariantIndex
                            ? "bg-[#0d9fa5] text-white shadow-sm"
                            : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                        }`}
                      >
                        {v.regionLabel || `Bản ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Khung video */}
                <SignVideoPlayer
                  key={activeVariant?.id}
                  videoUrl={activeVariant?.videoUrl}
                  placeholderVideo={activeVariant?.placeholderVideo}
                  title={`Video ký hiệu mẫu — ${signDetail.data.word}`}
                  autoPlay
                />

                {/* Thông tin chi tiết */}
                <div className="rounded-xl bg-[#F8FAFC] p-3 text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span>Khu vực: <strong>{activeVariant?.regionLabel || "Toàn quốc"}</strong></span>
                    {activeVariant?.signerLabel && (
                      <span className="ml-3">Người hướng dẫn: <strong>{activeVariant.signerLabel}</strong></span>
                    )}
                  </div>
                  {signDetail.data.topic && (
                    <span>Chủ đề: <strong>{signDetail.data.topic}</strong></span>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {signDetail.data.aiRecognizable && (
                    <Link
                      href={`/luyen-ai?signId=${signDetail.data.id}`}
                      className="rounded-xl bg-[#08757a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#065b5f] transition-colors"
                    >
                      Luyện ký hiệu này với AI →
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSignId(null)}
                    className="rounded-xl border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
