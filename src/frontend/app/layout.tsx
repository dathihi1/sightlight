import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SignLight — Học Ngôn ngữ Ký hiệu Việt Nam",
  description:
    "Học VSL theo lộ trình, có AI nhận diện ký hiệu động phản hồi đúng/sai và gợi ý sửa cụ thể.",
};

const NAV_ITEMS = [
  { href: "/hoc", label: "Lộ trình học" },
  { href: "/luyen-ai", label: "Luyện với AI" },
  { href: "/tu-dien", label: "Từ điển" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[var(--color-bg-default)] text-[var(--color-ink-900)]">
        <Providers>
          {/* Bỏ qua thanh điều hướng bằng bàn phím — yêu cầu WCAG 2.1 AA (NFR-14). */}
          <a
            href="#noi-dung-chinh"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-brand-600)] focus:px-4 focus:py-2 focus:text-white"
          >
            Bỏ qua tới nội dung chính
          </a>

          <header className="border-b border-[var(--color-border-default)]">
            <nav
              aria-label="Điều hướng chính"
              className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3"
            >
              <Link href="/" className="text-lg font-bold text-[var(--color-brand-600)]">
                SignLight
              </Link>
              <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-[var(--color-ink-600)] hover:text-[var(--color-brand-600)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/dang-nhap"
                className="rounded-lg border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium"
              >
                Đăng nhập
              </Link>
            </nav>
          </header>

          <main id="noi-dung-chinh" className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>

          <footer className="mt-16 border-t border-[var(--color-border-default)] px-4 py-6 text-center text-xs text-[var(--color-ink-600)]">
            {/* Ghi nguồn bắt buộc theo giấy phép CC BY 4.0 của VSL400 (SC-12, rủi ro T-12). */}
            <p>Dữ liệu huấn luyện mô hình: VSL400 (Zenodo) — giấy phép CC BY 4.0.</p>
            <p className="mt-1">
              SignLight là công cụ hỗ trợ luyện tập, không thay thế thông dịch viên.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
