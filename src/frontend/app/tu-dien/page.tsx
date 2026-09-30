"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mascot } from "@/components/ui/Mascot";
import { IconPlay } from "@/components/ui/Icons";
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

  // Ô tìm kiếm trên thanh trên (AppShell) chuyển sang đây với ?q=
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setInput(q);
      setQuery(q);
    }
  }, []);

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      <header className="flex items-center gap-5">
        <Mascot className="hidden w-20 shrink-0 sm:block" mood="wow" />
        <div>
          <p className="eyebrow text-sky-700">Từ điển VSL</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Tra ký hiệu</h1>
          <p className="mt-1 text-base text-ink-600">
            400 ký hiệu kèm video mẫu theo vùng miền. Gõ có dấu hay không dấu đều được.
          </p>
        </div>
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
          placeholder="Ví dụ: cảm ơn, gia đình, cái bàn"
          className="input h-14 flex-1 text-lg"
        />
        <button
          type="submit"
          className="btn btn-primary h-14"
        >
          Tra cứu
        </button>
      </form>

      {!query && (
        <div>
          <p className="text-sm font-bold text-ink-500">Thử tra</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Cảm ơn", "Xin chào", "Gia đình", "Yêu thương", "Ăn", "Uống nước"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setInput(w);
                  setQuery(w);
                }}
                className="rounded-2xl border border-ink-200 bg-white px-4 py-2 text-base font-semibold text-ink-700 hover:bg-ink-50"
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {search.isError && <ErrorNotice message="Không tra cứu được. Kiểm tra mạng rồi thử lại." />}
      {search.isLoading && query && <p className="text-base font-bold text-ink-600" role="status">Đang tìm…</p>}

      {search.data && (
        <section className="space-y-3">
          <p className="text-base font-bold text-ink-600">
            Tìm thấy {search.data.totalElements} kết quả cho &ldquo;{query}&rdquo;
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {search.data.items.map((sign) => (
              <li key={sign.id}>
                <button
                  type="button"
                  onClick={() => setSelectedSignId(sign.id)}
                  className="card card-interactive group flex h-full w-full flex-col justify-between p-5 text-left hover:border-sky-300"
                >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-bold text-ink-900">
                      {sign.word}
                    </h3>
                    {sign.aiRecognizable && (
                      <span className="chip shrink-0 bg-grape-100 text-grape-700">
                        Chấm AI
                      </span>
                    )}
                  </div>

                  {sign.meaning && (
                    <p className="text-base text-ink-600 line-clamp-2">{sign.meaning}</p>
                  )}

                  {sign.topic && (
                    <p className="text-sm font-bold text-ink-500">{sign.topic}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-sm font-bold text-ink-500">{sign.wordClass ?? ""}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600">
                    <IconPlay className="h-4 w-4" /> Xem video
                  </span>
                </div>
                </button>
              </li>
            ))}
          </ul>

          {search.data.items.length === 0 && (
            <EmptyState heading="h2" title="Không tìm thấy ký hiệu" body="Thử từ khác, hoặc bỏ bớt từ trong cụm." mood="sad" />
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
            className="card relative w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setSelectedSignId(null)}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-xl text-xl font-bold text-ink-500 hover:bg-ink-100"
              aria-label="Đóng"
            >
              ✕
            </button>

            {signDetail.isLoading && (
              <div className="flex h-64 items-center justify-center">
                <p className="text-base font-bold text-ink-600" role="status">Đang tải video…</p>
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
                    <h2 className="text-3xl font-bold text-ink-900">{signDetail.data.word}</h2>
                    {signDetail.data.wordClass && (
                      <span className="chip bg-ink-100 text-ink-600">
                        {signDetail.data.wordClass}
                      </span>
                    )}
                  </div>
                  {signDetail.data.meaning && (
                    <p className="mt-1 text-lg text-ink-600">{signDetail.data.meaning}</p>
                  )}
                </div>

                {/* Bộ chọn biến thể vùng miền nếu có nhiều video */}
                {variants.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-sm font-bold text-ink-500">Biến thể</span>
                    {variants.map((v, idx) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVariantIndex(idx)}
                        aria-pressed={idx === activeVariantIndex}
                        className={`shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${
                          idx === activeVariantIndex
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-ink-200 text-ink-600 hover:bg-ink-50"
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
                <div className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-600 flex flex-wrap items-center justify-between gap-2">
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
                      className="btn btn-grape btn-sm"
                    >
                      Luyện với AI
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedSignId(null)}
                    className="btn btn-secondary btn-sm"
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
