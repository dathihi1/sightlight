import { IconLightning, IconChart, IconBuilding } from "@/components/ui/Icons";

interface BusinessSectionProps {
  lang: "en" | "vi";
}

export function BusinessSection({ lang }: BusinessSectionProps) {
  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);

  const pillars = [
    {
      title: t("Chạy ngay trên web", "Runs in the browser"),
      desc: t("Nhân sự mở link là học được, không cần IT cài đặt.", "Staff open a link and start — no IT setup."),
      Icon: IconLightning,
      tone: "bg-sun-50 text-sun-600",
    },
    {
      title: t("Theo dõi tiến độ", "Track progress"),
      desc: t("Xem tiến độ học và điểm luyện tập AI của từng người.", "See each learner's progress and AI practice scores."),
      Icon: IconChart,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      title: t("Gói chuyên ngành", "Industry packs"),
      desc: t("Bộ ký hiệu cho y tế, khách sạn, ngân hàng, quầy dịch vụ.", "Sign sets for healthcare, hospitality, banking, front desks."),
      Icon: IconBuilding,
      tone: "bg-grape-50 text-grape-600",
    },
  ];

  return (
    <section id="businesses" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card-flat grid gap-10 rounded-[2.5rem] bg-brand-50 border-brand-100 p-8 sm:p-12 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-2">
            <p className="eyebrow">{t("Trường học & tổ chức", "Schools & organizations")}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {t("Đào tạo cả đội ngũ giao tiếp với người Điếc.", "Train your whole team to sign.")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              {t(
                "Cho phòng máy trường học, bệnh viện, quầy giao dịch và doanh nghiệp dịch vụ.",
                "For school labs, hospitals, service counters and customer-facing teams.",
              )}
            </p>
            <a href="mailto:contact@signlight.vn?subject=SignLight%20cho%20t%E1%BB%95%20ch%E1%BB%A9c" className="btn btn-primary mt-8">
              {t("Liên hệ tư vấn", "Contact us")}
            </a>
          </div>

          <ul className="grid gap-4 lg:col-span-3">
            {pillars.map(({ title, desc, Icon, tone }) => (
              <li key={title} className="card flex items-start gap-4 p-5">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-900">{title}</h3>
                  <p className="mt-1 text-base text-ink-600">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
