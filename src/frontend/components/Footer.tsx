"use client";

import Link from "next/link";
import { SignLightLogo } from "./SignLightLogo";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const swaggerUrl =
    process.env.NEXT_PUBLIC_SWAGGER_URL ??
    (process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/swagger-ui.html`
      : "http://localhost:18080/swagger-ui.html");

  const columns = [
    {
      title: t("Học", "Learn"),
      links: [
        { href: "/hoc", label: t("Lộ trình", "Learning path") },
        { href: "/luyen-ai", label: t("Luyện camera", "Camera practice") },
        { href: "/tu-dien", label: t("Từ điển VSL", "VSL dictionary") },
        { href: "/hanh-trinh", label: t("Hành trình", "Journey") },
      ],
    },
    {
      title: "SignLight",
      links: [
        { href: "/about", label: t("Về chúng tôi", "About") },
        { href: "/blog", label: t("Bài viết", "Blog") },
        { href: "/nang-cap", label: "Premium" },
        { href: "/#businesses", label: t("Cho tổ chức", "For organizations") },
      ],
    },
    {
      title: t("Nhà phát triển", "Developers"),
      links: [
        { href: swaggerUrl, label: "API (Swagger)", external: true },
        { href: "https://github.com/duynt1309ichi/Signlight_Web", label: "GitHub", external: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <SignLightLogo size={40} />
              <span className="text-xl font-bold tracking-tight text-ink-900">
                Sign<span className="text-brand-500">Light</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-base text-ink-600">
              {t("Học Ngôn ngữ Ký hiệu Việt Nam, mỗi ngày một chút.", "Learn Vietnamese Sign Language, a little every day.")}
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-sm font-bold text-ink-500">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-block py-1 font-bold text-ink-700 hover:text-brand-600">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="inline-block py-1 font-bold text-ink-700 hover:text-brand-600">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t border-ink-100 pt-6 text-sm text-ink-600">
          <p>© 2026 SignLight.</p>
          <p className="mt-1">
            {t(
              "Dữ liệu huấn luyện mô hình: VSL400 (Zenodo) — giấy phép CC BY 4.0. SignLight là công cụ luyện tập, không thay thế thông dịch viên.",
              "Model training data: VSL400 (Zenodo) — CC BY 4.0. SignLight is a practice tool and does not replace interpreters.",
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
