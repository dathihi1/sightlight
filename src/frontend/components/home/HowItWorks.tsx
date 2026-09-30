"use client";

import { useLanguage } from "@/context/LanguageContext";
import { IconPlay, IconWebcam, IconStar } from "@/components/ui/Icons";

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      n: 1,
      title: t("Xem mẫu", "Watch"),
      body: t(
        "Người Điếc bản ngữ làm mẫu từng ký hiệu. Xem chậm, xem lại bao nhiêu lần cũng được.",
        "Native Deaf signers demo each sign. Slow it down and replay as often as you like.",
      ),
      icon: <IconPlay className="h-8 w-8" />,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      n: 2,
      title: t("Làm theo", "Copy"),
      body: t(
        "Bật camera và làm theo. AI theo dõi 21 điểm trên bàn tay bạn — video không rời khỏi máy.",
        "Turn on your camera and copy. AI tracks 21 points on your hand — video never leaves your device.",
      ),
      icon: <IconWebcam className="h-8 w-8" />,
      tone: "bg-grape-50 text-grape-600",
    },
    {
      n: 3,
      title: t("Nhận điểm", "Score"),
      body: t(
        "Biết ngay đúng hay sai, nhận XP, giữ chuỗi ngày và mở khoá bài tiếp theo.",
        "See instantly if you got it, earn XP, keep your streak and unlock the next lesson.",
      ),
      icon: <IconStar className="h-9 w-9" />,
      tone: "bg-sun-50 text-sun-600",
    },
  ];

  return (
    <section className="bg-ink-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("Cách học", "How it works")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            {t("Ba bước. Mỗi ngày một chút.", "Three steps. A little every day.")}
          </h2>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="card p-7">
              <span
                className={`grid h-16 w-16 place-items-center rounded-2xl ${s.tone}`}
              >
                {s.icon}
              </span>
              <p className="mt-6 text-sm font-bold text-ink-500">
                {t("Bước", "Step")} {s.n}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-ink-900">{s.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
