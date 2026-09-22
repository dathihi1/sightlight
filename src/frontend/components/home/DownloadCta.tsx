import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { IconHandshake } from "@/components/ui/Icons";

interface DownloadCtaProps {
  lang: "en" | "vi";
}

export function DownloadCta({ lang }: DownloadCtaProps) {
  return (
    <section className="py-20 sm:py-28 bg-linear-to-b from-[#F4EFE6] via-[#EDE6DA] to-[#E2DBD0] border-t border-[#E2DBD0] relative overflow-hidden">
      {/* Decorative Pastel Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[#E2DBD0] -z-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#E2DBD0] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <ScrollReveal direction="up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-6 border border-[#b2e7e9]">
            <IconHandshake className="w-4 h-4 text-[#0d9fa5]" />
            <span>{lang === "vi" ? "Bắt Đầu Hành Trình" : "Start Your Journey Today"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] max-w-3xl mx-auto leading-tight">
            {lang === "vi"
              ? "Chấm Dứt Bữa Cơm Câm Lặng. Hãy Để Đôi Tay Nối Lại Nhịp Cầu Yêu Thương."
              : "End the Silent Table. Let Your Hands Reconnect the Bridge of Love."}
          </h2>

          <p className="mt-6 text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto font-normal">
            {lang === "vi"
              ? "Người thân của bạn không cần những điều lớn lao, họ chỉ mong một lần được cùng cười, cùng hiểu trọn vẹn những câu chuyện bên gia đình. Đừng để sự im lặng làm mòn đi tình cảm gắn bó. Hãy mở máy tính, dành cho họ 10 phút kiên nhẫn hôm nay."
              : "Your loved ones don't need grand gestures; they simply wish to laugh and truly understand the stories shared at family gatherings. Don't let silence wear away deep bonds. Open your computer and dedicate 10 patient minutes to them today."}
          </p>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dang-ky"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-[0_4px_16px_rgba(13,159,165,0.3)] hover:shadow-[0_6px_22px_rgba(13,159,165,0.4)] transition-all hover:scale-102"
            >
              <span>
                {lang === "vi" ? "Học bài đầu tiên ngay — Hoàn toàn miễn phí" : "Start Your First Lesson Now — 100% Free"}
              </span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/luyen-ai"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-semibold text-[#0F172A] bg-white border border-[#E2DBD0] hover:bg-[#F4EFE6] transition-colors shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#0d9fa5] animate-ping" />
              <span>
                {lang === "vi" ? "Thử phòng luyện Webcam" : "Try Webcam Practice Room"}
              </span>
            </Link>
          </div>

          {/* Platform Roadmap Badges (No Mobile App Store) */}
          <div className="mt-12 pt-8 border-t border-[#E2DBD0]/80 flex flex-col items-center">
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
              {lang === "vi" ? "Lộ trình Phát triển Nền tảng" : "Platform Development Roadmap"}
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-2xl">
              <div className="flex-1 bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-[#0d9fa5]/30 shadow-xs text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-[#0d9fa5] animate-pulse" />
                  <span className="text-xs font-bold text-[#08757a]">
                    {lang === "vi" ? "Đang phát triển" : "In Active Development"}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {lang === "vi"
                    ? "Ứng dụng SignLight Desktop chuyên dụng cho Windows & macOS (tích hợp mô hình AI tải sẵn, hỗ trợ học ngoại tuyến 100%)."
                    : "Dedicated SignLight Desktop app for Windows & macOS (bundled offline AI models, 100% offline support)."}
                </p>
              </div>

              <div className="flex-1 bg-white/70 backdrop-blur-xs rounded-2xl p-4 border border-[#E2DBD0] shadow-xs text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
                  <span className="text-xs font-bold text-[#64748B]">
                    {lang === "vi" ? "Giai đoạn tiếp theo" : "Next Milestone"}
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {lang === "vi"
                    ? "Ứng dụng di động (Mobile App) trên iOS & Android phục vụ ôn tập nhanh từ vựng mọi lúc mọi nơi."
                    : "Mobile companion app for iOS & Android for quick on-the-go vocabulary retention."}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
