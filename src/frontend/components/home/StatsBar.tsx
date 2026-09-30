"use client";

import { useLanguage } from "@/context/LanguageContext";

export function StatsBar() {
  const { t } = useLanguage();

  const stats = [
    { value: "400", label: t("ký hiệu VSL", "VSL signs"), tone: "bg-brand-50 text-brand-600 border-brand-200" },
    { value: "17", label: t("chủ đề đời sống", "real-life units"), tone: "bg-flame-50 text-flame-700 border-flame-200" },
    { value: "24", label: t("người mẫu Điếc bản ngữ", "native Deaf signers"), tone: "bg-grape-50 text-grape-600 border-grape-200" },
    { value: "<35ms", label: t("AI chấm mỗi cử chỉ", "AI scoring per sign"), tone: "bg-sun-50 text-sun-700 border-sun-200" },
  ];

  return (
    <section className="bg-white pb-16 sm:pb-20">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className={`rounded-3xl border px-5 py-6 text-center ${s.tone}`}>
            <p className="text-4xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-1 text-sm font-semibold text-ink-700">{s.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
