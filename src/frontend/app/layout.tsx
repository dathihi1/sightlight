import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
    <html lang="vi" suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col bg-[#F4EFE6] text-[#1E293B] antialiased selection:bg-[#0d9fa5] selection:text-white"
        suppressHydrationWarning
      >
        {/* Google Identity Services — tai sau khi trang da hien thi */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>
          {/* Skip link for WCAG accessibility */}
          <a
            href="#noi-dung-chinh"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[#0d9fa5] focus:px-4 focus:py-2 focus:text-white font-semibold shadow-md"
          >
            Bỏ qua tới nội dung chính
          </a>

          {/* SignLight Navbar with Blue Theme & Logo */}
          <Navbar />

          {/* Main Full-width Content Area */}
          <main id="noi-dung-chinh" className="flex-1 w-full">
            {children}
          </main>

          {/* SignLight Multi-column Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
