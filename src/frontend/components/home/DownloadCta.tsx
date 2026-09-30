"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Mascot } from "@/components/ui/Mascot";

export function DownloadCta() {
  const { t } = useLanguage();

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-brand-500 px-6 py-14 text-center sm:px-12 sm:py-16">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-400/60" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-brand-600/70" aria-hidden="true" />

        <div className="relative">
          <Mascot className="mx-auto w-24 sm:w-28" wave />
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {t("Ký hiệu đầu tiên chỉ mất 2 phút.", "Your first sign takes 2 minutes.")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-bold text-white">
            {t(
              "Không cần cài đặt. Mở trình duyệt, bật camera và bắt đầu.",
              "Nothing to install. Open your browser, turn on the camera and go.",
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/dang-ky" className="btn btn-sun btn-lg">
              {t("Bắt đầu miễn phí", "Get started free")}
            </Link>
            <Link
              href="/dang-nhap"
              className="btn btn-lg border border-white/40 text-white hover:bg-white/10"
            >
              {t("Tôi đã có tài khoản", "I have an account")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
