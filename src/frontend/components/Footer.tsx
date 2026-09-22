"use client";

import Link from "next/link";
import { SignLightLogo } from "./SignLightLogo";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { lang, t } = useLanguage();
  const swaggerUrl =
    process.env.NEXT_PUBLIC_SWAGGER_URL ??
    (process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/swagger-ui.html`
      : "http://localhost:18080/swagger-ui.html");

  return (
    <footer className="border-t border-[#E2DBD0] bg-[#F4EFE6] pt-16 pb-12 text-[#475569]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Brand Header inside Footer */}
        <div className="flex items-center gap-3 mb-10 pb-8 border-b border-[#E2DBD0]">
          <SignLightLogo size={40} />
          <div>
            <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">SignLight</span>
            <p className="text-xs text-[#64748B]">
              {t(
                "Nền tảng học Ngôn ngữ Ký hiệu Việt Nam (VSL)",
                "Vietnamese Sign Language (VSL) Learning Platform",
              )}
            </p>
          </div>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F172A] tracking-tight">
              {t("Về chúng tôi", "Company")}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/about" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Giới thiệu SignLight", "About SignLight")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Bài viết & Cẩm nang", "Blog & Articles")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Cộng đồng người Điếc", "Deaf Community")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F172A] tracking-tight">
              {t("Pháp lý & Bảo mật", "Legal & Privacy")}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Chính sách Quyền riêng tư", "Privacy Policy")}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Bảo mật Camera", "Camera Privacy Guarantee")}
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Điều khoản dịch vụ", "Terms & Conditions")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F172A] tracking-tight">
              {t("Tài nguyên học VSL", "VSL Resources")}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/tu-dien" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Từ điển ký hiệu VSL", "VSL Dictionary")}
                </Link>
              </li>
              <li>
                <Link href="/hoc" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Lộ trình bài học", "Learning Curriculum")}
                </Link>
              </li>
              <li>
                <Link href="/hanh-trinh" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Hành trình & Lan toả", "Journey & Stories")}
                </Link>
              </li>
              <li>
                <a
                  href={swaggerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#0d9fa5] transition-colors"
                >
                  <span>{t("Tài liệu API Swagger", "Swagger API Docs")}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-sm bg-[#e6f7f8] text-[#08757a] font-bold">
                    v0.1
                  </span>
                </a>
              </li>
              <li>
                <Link href="/luyen-ai" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Luyện tập Camera", "Camera Practice")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Solutions */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#0F172A] tracking-tight">
              {t("Giải pháp tổ chức", "Enterprise")}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/#businesses" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Doanh nghiệp & Cơ quan", "Corporate & Workplace")}
                </Link>
              </li>
              <li>
                <Link href="/#businesses" className="hover:text-[#0d9fa5] transition-colors">
                  {t("Trường học & Bệnh viện", "Schools & Hospitals")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#E2DBD0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#0F172A]">
              {t("Kênh liên kết:", "Follow us:")}
            </span>
            <div className="flex items-center gap-2.5 text-xs">
              <a
                href="https://github.com/duynt1309ichi/Signlight_Web"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-full bg-white border border-[#E2DBD0] text-[#0F172A] hover:text-[#0d9fa5] hover:bg-[#e6f7f8] transition-colors font-mono"
              >
                GitHub Repo
              </a>
            </div>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p>
              {t(
                "© 2026 SignLight. Thiết kế chuẩn nhận diện SignLight. Bản quyền đã được bảo hộ.",
                "© 2026 SignLight. Standard SignLight design guidelines. All rights reserved.",
              )}
            </p>
            <p className="text-[11px] text-[#94A3B8]">
              {t(
                "Dữ liệu huấn luyện mô hình: VSL400 (Zenodo) — giấy phép CC BY 4.0. SignLight là công cụ hỗ trợ luyện tập, không thay thế thông dịch viên.",
                "Model training data: VSL400 (Zenodo) — CC BY 4.0 license. SignLight is a practice tool and does not replace professional interpreters.",
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
