import type { Metadata } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteChrome } from "@/components/SiteChrome";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SignLight — Học Ngôn ngữ Ký hiệu Việt Nam (VSL)",
  description:
    "Nền tảng học Ngôn ngữ Ký hiệu Việt Nam (VSL) trực tuyến. Chấm ký hiệu động tức thì qua camera. Tự tin giao tiếp chỉ với 10 phút mỗi ngày.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={beVietnam.variable} suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col bg-ink-50 font-sans text-ink-900 antialiased selection:bg-brand-200 selection:text-ink-900"
        suppressHydrationWarning
      >
        {/* Google Identity Services — tai sau khi trang da hien thi */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>
          {/* Skip link for WCAG accessibility */}
          <a
            href="#noi-dung-chinh"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-white font-semibold shadow-md"
          >
            Bỏ qua tới nội dung chính
          </a>

          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
