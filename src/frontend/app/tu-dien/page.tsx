"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
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
  aiRecognizable: boolean;
}

/** SCR-17 — từ điển ký hiệu (FR-21). Tra được cả khi gõ không dấu. */
export default function DictionaryPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const search = useQuery({
    queryKey: ["dictionary", query],
    enabled: query.trim().length > 0,
    queryFn: () =>
      apiCall<SearchResult>(`/api/v1/dictionary/search?q=${encodeURIComponent(query)}`, {
        auth: false,
      }),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Từ điển ký hiệu</h1>
        <p className="text-sm text-[var(--color-ink-600)]">
          Gõ có dấu hay không dấu đều được — ví dụ “cai ban” cũng ra “Cái bàn”.
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
          placeholder="Nhập từ cần tra…"
          className="flex-1 rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-brand-600)] px-5 py-2 font-medium text-white hover:bg-[var(--color-brand-700)]"
        >
          Tra cứu
        </button>
      </form>

      {search.isError && <ErrorNotice message="Không tra cứu được, vui lòng thử lại." />}
      {search.isLoading && query && <p className="text-[var(--color-ink-600)]">Đang tìm…</p>}

      {search.data && (
        <section className="space-y-3">
          <p className="text-sm text-[var(--color-ink-600)]">
            {search.data.totalElements} kết quả cho “{query}”
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {search.data.items.map((sign) => (
              <li
                key={sign.id}
                className="rounded-xl border border-[var(--color-border-default)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{sign.word}</p>
                    {sign.meaning && (
                      <p className="text-sm text-[var(--color-ink-600)]">{sign.meaning}</p>
                    )}
                  </div>
                  {/* Chỉ mời luyện AI với ký hiệu thật sự có chấm tự động (BR-A111). */}
                  {sign.aiRecognizable && (
                    <span className="shrink-0 rounded-full bg-[var(--color-brand-050)] px-2 py-0.5 text-xs text-[var(--color-brand-600)]">
                      Có chấm AI
                    </span>
                  )}
                </div>
                {sign.topic && (
                  <p className="mt-2 text-xs text-[var(--color-ink-600)]">Chủ đề: {sign.topic}</p>
                )}
              </li>
            ))}
          </ul>
          {search.data.items.length === 0 && (
            <p className="text-[var(--color-ink-600)]">
              Chưa có ký hiệu nào khớp. Bạn có thể báo thiếu ký hiệu để chúng tôi bổ sung.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
