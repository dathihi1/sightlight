"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { IconCheck, IconLock, IconCrown } from "@/components/ui/Icons";

type RowState = "done" | "current" | "locked";

export function PathPreview() {
  const { t } = useLanguage();

  const rows: { state: RowState; title: string; meta: string }[] = [
    { state: "done", title: t("Xin chào", "Hello"), meta: t("Đã hoàn thành · 96%", "Completed · 96%") },
    { state: "done", title: t("Gia đình", "Family"), meta: t("Đã hoàn thành · 91%", "Completed · 91%") },
    { state: "current", title: t("Con số 1–10", "Numbers 1–10"), meta: t("Đang học · 3/6 ký hiệu", "In progress · 3/6 signs") },
    { state: "locked", title: t("Màu sắc", "Colors"), meta: t("Học xong bài trước để mở", "Finish the previous lesson") },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{t("Lộ trình", "Learning path")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            {t("17 chủ đề, mở khoá từng bước.", "17 units, unlocked one step at a time.")}
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-600">
            {t(
              "Từ lời chào đến cảm xúc — mỗi bài ngắn vài phút, có ôn tập để bạn nhớ lâu. Chủ đề đầu tiên miễn phí.",
              "From hello to feelings — every lesson takes minutes, with reviews so it sticks. The first unit is free.",
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dang-ky" className="btn btn-primary">
              {t("Học chủ đề 1 miễn phí", "Start unit 1 free")}
            </Link>
            <Link href="/nang-cap" className="btn btn-secondary">
              <IconCrown className="h-5 w-5" />
              {t("Gói Premium", "Premium")}
            </Link>
          </div>
        </div>

        <div className="card p-6" aria-hidden="true">
          <div className="flex items-center gap-4 border-b border-ink-200 pb-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-600">1</span>
            <div>
              <p className="text-lg font-bold text-ink-900">{t("Chào hỏi & Gia đình", "Greetings & Family")}</p>
              <p className="text-sm text-ink-600">{t("2/6 bài đã xong", "2/6 lessons done")}</p>
            </div>
          </div>
          <ol className="mt-4">
            {rows.map((r, i) => (
              <li key={r.title} className="relative flex gap-3">
                {i < rows.length - 1 && <span className="absolute bottom-0 left-4 top-11 w-px -translate-x-1/2 bg-ink-200" />}
                <div className="pt-3.5">
                  {r.state === "done" && (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">
                      <IconCheck className="h-4 w-4" />
                    </span>
                  )}
                  {r.state === "current" && (
                    <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-brand-500 bg-white">
                      <span className="h-3 w-3 rounded-full bg-brand-500" />
                    </span>
                  )}
                  {r.state === "locked" && (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-100 text-ink-400">
                      <IconLock className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div
                  className={`mb-1 flex flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                    r.state === "current" ? "bg-brand-50" : ""
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${r.state === "locked" ? "text-ink-500" : "text-ink-900"}`}>{r.title}</p>
                    <p className="text-sm text-ink-600">{r.meta}</p>
                  </div>
                  {r.state === "current" && <span className="btn btn-primary btn-sm">{t("Tiếp tục", "Continue")}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
