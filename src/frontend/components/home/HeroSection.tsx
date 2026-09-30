"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Mascot } from "@/components/ui/Mascot";
import { IconFlame, IconGem, IconCheck, IconPlay } from "@/components/ui/Icons";

/** Khung xương bàn tay giản lược cho ô "Camera của bạn". */
function HandSkeleton() {
  const pts = [
    [50, 88], [34, 76], [24, 60], [18, 46], [40, 54], [38, 34], [37, 20],
    [52, 52], [52, 30], [52, 14], [63, 54], [65, 34], [66, 22], [73, 60], [77, 46], [79, 36],
  ];
  const bones = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [0, 7], [7, 8], [8, 9], [0, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [4, 7], [7, 10], [10, 13]];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <g stroke="var(--color-brand-300)" strokeWidth="2.5" strokeLinecap="round">
        {bones.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
        ))}
      </g>
      {pts.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--color-sun-300)" />
      ))}
    </svg>
  );
}

/** Mô phỏng màn bài học: tiến độ, tim, video mẫu + camera, thanh phản hồi "Chính xác!". */
function LessonMock() {
  const { t } = useLanguage();
  return (
    <div className="card relative w-full max-w-md overflow-hidden rounded-[2rem]" style={{ boxShadow: "var(--shadow-lift)" }} aria-hidden="true">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 text-sm text-ink-600">
        <span className="font-semibold text-ink-800">{t("Bài 3 · Chào hỏi", "Lesson 3 · Greetings")}</span>
        <span>2/5</span>
      </div>
      <div className="progress mx-5 mt-2 w-auto">
        <span style={{ width: "40%" }} />
      </div>

      <div className="px-5 pt-5">
        <p className="eyebrow">{t("Ký hiệu mới", "New sign")}</p>
        <p className="mt-1 text-3xl font-bold text-ink-900">{t("Cảm ơn", "Thank you")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sky-900">
          <div className="absolute inset-0 grid place-items-center">
            <Mascot className="w-28" wave />
          </div>
          <span className="absolute left-2 top-2 rounded-lg bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">
            {t("Video mẫu", "Demo")}
          </span>
          <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sky-700">
            <IconPlay className="h-4 w-4" />
          </span>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-900">
          <div className="absolute inset-3">
            <HandSkeleton />
          </div>
          <div className="animate-scan-line absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-brand-400/0 via-brand-400/15 to-brand-400/0" />
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-danger-400" />
            {t("Camera", "Camera")}
          </span>
        </div>
      </div>

      <div className="m-5 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white">
          <IconCheck className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-brand-700">{t("Chính xác 96%", "96% accurate")}</p>
          <p className="text-sm text-ink-600">{t("Góc cổ tay rất chuẩn.", "Great wrist angle.")}</p>
        </div>
        <span className="chip bg-sun-100 text-sun-700">+10 XP</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="animate-pop-in">
          <span className="chip bg-brand-50 text-brand-600">
            <span className="h-2 w-2 rounded-full bg-brand-400" />
            {t("Ngôn ngữ Ký hiệu Việt Nam", "Vietnamese Sign Language")}
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-ink-900 sm:text-5xl">
            {t("Học ngôn ngữ ký hiệu,", "Learn sign language,")}
            <br />
            <span className="text-brand-500">{t("từng cử chỉ một.", "one gesture at a time.")}</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
            {t(
              "Xem người Điếc làm mẫu, làm theo trước camera và nhận điểm ngay lập tức. Chỉ 10 phút mỗi ngày.",
              "Watch Deaf signers demo, copy them on camera and get scored instantly. Just 10 minutes a day.",
            )}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link href="/dang-ky" className="btn btn-primary btn-lg">
              {t("Bắt đầu miễn phí", "Get started free")}
            </Link>
            <Link href="/luyen-ai" className="btn btn-secondary btn-lg">
              {t("Thử camera ngay", "Try the camera")}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink-600">
            <li className="flex items-center gap-2">
              <IconFlame className="h-5 w-5" /> {t("Chuỗi ngày học", "Daily streaks")}
            </li>
            <li className="flex items-center gap-2">
              <IconGem className="h-5 w-5" /> {t("XP & huy hiệu", "XP & badges")}
            </li>
            <li className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white">
                <IconCheck className="h-3 w-3" />
              </span>
              {t("Camera xử lý ngay trên máy bạn", "Camera stays on your device")}
            </li>
          </ul>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute -right-6 -top-8 h-72 w-72 rounded-full bg-brand-50 sm:h-96 sm:w-96" aria-hidden="true" />
          <div className="absolute -bottom-10 left-4 h-40 w-40 rounded-full bg-sun-100" aria-hidden="true" />

          <div className="relative w-full max-w-md">
            <LessonMock />

            <div className="card animate-float-slow absolute -left-4 -bottom-5 flex items-center gap-2 rounded-2xl px-3 py-2 sm:-left-14" aria-hidden="true">
              <IconFlame className="h-7 w-7" />
              <div className="leading-tight">
                <p className="text-lg font-bold text-flame-600">7</p>
                <p className="text-xs text-ink-600">{t("ngày liên tiếp", "day streak")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
