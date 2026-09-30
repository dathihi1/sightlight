"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BrowserMockup } from "@/components/ui/BrowserMockup";
import {
  IconGrid,
  IconWebcam,
  IconBook,
  IconCards,
  IconShield,
} from "@/components/ui/Icons";

interface AppShowcaseProps {
  lang: "en" | "vi";
}

export function AppShowcase({ lang }: AppShowcaseProps) {
  const [activeTab, setActiveTab] = useState<number>(0);

  const features = [
    {
      id: "curriculum",
      Icon: IconGrid,
      titleVi: "Lộ trình 17 Unit Cấp độ",
      titleEn: "17-Unit Progressive Curriculum",
      descVi:
        "Thiết kế 5–10 phút mỗi ngày, đưa bạn từ làm quen đại từ xưng hô gia đình đến tự tin đối thoại xã hội.",
      descEn:
        "Designed for 5–10 minutes daily, guiding you from basic family pronouns to confident social conversation.",
      url: "signlight.vn/hoc",
      linkTextVi: "Khám phá 17 Unit bài học →",
      linkTextEn: "Explore 17 Curriculum Units →",
      href: "/hoc",
    },
    {
      id: "mirror-mode",
      Icon: IconWebcam,
      titleVi: "Phòng Luyện Mirror Mode Webcam",
      titleEn: "Mirror Mode Webcam Studio",
      descVi:
        "Tận dụng webcam laptop để quan sát đồng thời cả hai tay, cổ tay và biểu cảm khuôn mặt song song video mẫu.",
      descEn:
        "Leverage desktop webcams to simultaneously compare both hands, wrists, and facial expressions against native video.",
      url: "signlight.vn/luyen-ai",
      linkTextVi: "Vào phòng luyện webcam →",
      linkTextEn: "Enter Webcam Studio →",
      href: "/luyen-ai",
    },
    {
      id: "dictionary",
      Icon: IconBook,
      titleVi: "Từ Điển Tra Cứu Nhanh 400 Từ",
      titleEn: "400-Word Fast Sign Dictionary",
      descVi:
        "Tìm kiếm từ vựng bằng bàn phím, hiển thị tức thì video vòng lặp Full HD từ nhiều người mẫu ký hiệu khác nhau.",
      descEn:
        "Instant keyboard search across 400 signs with Full HD looping video clips from diverse native signers.",
      url: "signlight.vn/tu-dien",
      linkTextVi: "Tra cứu từ điển VSL →",
      linkTextEn: "Browse VSL Dictionary →",
      href: "/tu-dien",
    },
    {
      id: "spaced-repetition",
      Icon: IconCards,
      titleVi: "Thẻ Từ Vựng Lặp lại Ngắt quãng",
      titleEn: "Spaced Repetition Flashcards",
      descVi:
        "Tự động lưu lại các từ bạn thực hiện chưa chuẩn để nhắc nhở ôn luyện vào các chu kỳ ngày tiếp theo.",
      descEn:
        "Automatically identifies signs needing reinforcement and schedules timely reviews for permanent recall.",
      url: "signlight.vn/tu-dien",
      linkTextVi: "Ôn tập thẻ nhớ ngắt quãng →",
      linkTextEn: "Review with Flashcards →",
      href: "/tu-dien",
    },
    {
      id: "privacy",
      Icon: IconShield,
      titleVi: "Bảo Mật Camera 100% Client-Side",
      titleEn: "100% Client-Side Camera Privacy",
      descVi:
        "Toàn bộ quá trình nhận diện diễn ra trực tiếp trên máy tính của bạn, không gửi luồng video lên server đám mây.",
      descEn:
        "All hand landmark detection runs locally on your computer with zero video data uploaded to cloud servers.",
      url: "signlight.vn/dang-nhap",
      linkTextVi: "Tìm hiểu kiến trúc bảo mật →",
      linkTextEn: "Learn About Privacy →",
      href: "/dang-nhap",
    },
  ];

  const current = features[activeTab];

  return (
    <section
      id="our-web"
      className="py-16 sm:py-24 bg-ink-50 relative overflow-hidden"
    >

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Headline */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <ScrollReveal direction="up">
            <span className="eyebrow block mb-3">
              {lang === "vi"
                ? "Mọi thứ trong một tab"
                : "All in one tab"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              {lang === "vi"
                ? "Học, luyện, tra cứu — ngay trên trình duyệt."
                : "Learn, practice, look up — right in your browser."}
            </h2>
          </ScrollReveal>
        </div>

        {/* Content Layout: Accordion on Left (col-span-5), Browser on Right (col-span-7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 5 Accordion Items */}
          <div className="lg:col-span-5 space-y-3">
            <ScrollReveal direction="up" delayMs={100}>
              <div className="space-y-3">
                {features.map((item, idx) => {
                  const isSelected = activeTab === idx;
                  const IconComp = item.Icon;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border bg-white transition-colors duration-200 overflow-hidden ${
                        isSelected ? "border-brand-400" : "border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      <button
                        onClick={() => setActiveTab(idx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-base sm:text-lg text-ink-900 cursor-pointer"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? "bg-brand-400 text-white"
                                : "bg-ink-100 text-ink-600"
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </span>
                          <span className="text-base font-semibold">
                            {lang === "vi" ? item.titleVi : item.titleEn}
                          </span>
                        </span>
                        <svg
                          className={`w-4 h-4 text-brand-500 transition-transform duration-300 shrink-0 ml-2 ${
                            isSelected ? "rotate-180" : ""
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      {isSelected && (
                        <div className="px-5 pb-5 pt-1 text-sm sm:text-base text-ink-600 leading-relaxed">
                          <p>{lang === "vi" ? item.descVi : item.descEn}</p>
                          <Link
                            href={item.href}
                            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-600 hover:underline"
                          >
                            {lang === "vi" ? item.linkTextVi : item.linkTextEn}
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Desktop Browser Mockup Synchronized with Active Accordion */}
          <div className="lg:col-span-7 flex justify-center relative">
            <ScrollReveal direction="up" delayMs={200} className="w-full">
              <BrowserMockup url={current.url} className="w-full">
                {/* Visual Viewport Synchronized with Active Feature */}
                {activeTab === 0 && (
                  /* Feature 0: 17-Unit Curriculum Dashboard */
                  <div className="h-full w-full bg-ink-50 p-4 sm:p-6 flex flex-col justify-between select-none">
                    <div className="flex items-center justify-between pb-3 border-b border-ink-200">
                      <div>
                        <span className="text-[11px] font-bold text-brand-600 block">
                          {lang === "vi"
                            ? "Lộ trình Chuẩn hóa 17 Unit"
                            : "Standardized 17-Unit Curriculum"}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-ink-900">
                          {lang === "vi"
                            ? "Khóa Cơ Bản Đến Giao Tiếp Xã Hội"
                            : "Foundations to Social Fluency"}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-bold">
                        {lang === "vi" ? "Đã xong 8/17 Unit (47%)" : "8/17 Units Done (47%)"}
                      </span>
                    </div>

                    {/* Unit Cards Row */}
                    <div className="grid grid-cols-3 gap-2.5 my-3">
                      <div className="bg-white rounded-xl p-3 border border-brand-300 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                            Unit 1
                          </span>
                          <span className="text-brand-600 font-bold text-xs">✓</span>
                        </div>
                        <p className="text-xs font-bold text-ink-900 truncate">
                          {lang === "vi" ? "Đại từ & Chào hỏi" : "Pronouns & Greetings"}
                        </p>
                        <p className="text-[10px] text-ink-600 mt-0.5">
                          {lang === "vi" ? "32/32 từ vựng" : "32/32 words"}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-brand-500 shadow-xs ring-1 ring-brand-500/20">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            Unit 2
                          </span>
                          <span className="text-[10px] font-bold text-brand-500">75%</span>
                        </div>
                        <p className="text-xs font-bold text-ink-900 truncate">
                          {lang === "vi" ? "Gia đình & Bữa ăn" : "Family & Dining"}
                        </p>
                        <div className="w-full bg-ink-200 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-brand-500 h-full w-3/4 rounded-full" />
                        </div>
                      </div>

                      <div className="bg-white/80 rounded-xl p-3 border border-ink-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-ink-600 bg-ink-100 px-1.5 py-0.5 rounded">
                            Unit 3
                          </span>
                          <span className="text-[10px] text-ink-400">
                            {lang === "vi" ? "Mở khóa" : "Unlocked"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-ink-900 truncate">
                          {lang === "vi" ? "Trường học & Nghề nghiệp" : "School & Career"}
                        </p>
                        <p className="text-[10px] text-ink-600 mt-0.5">
                          {lang === "vi" ? "36 ký hiệu mới" : "36 new signs"}
                        </p>
                      </div>
                    </div>

                    {/* Active Next Lesson CTA */}
                    <div className="bg-white rounded-xl p-3 border border-ink-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 border border-brand-200 flex items-center justify-center shrink-0 font-bold text-xs">
                          2.4
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink-900">
                            {lang === "vi" ? "Bài tiếp theo: Mời cơm & Chúc ngon miệng" : "Next: Inviting family to dinner"}
                          </p>
                          <p className="text-[10px] text-ink-600">
                            {lang === "vi" ? "Thời lượng: 8 phút · Video mẫu người thật 1080p" : "Duration: 8 mins · 1080p native video"}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold shrink-0">
                        {lang === "vi" ? "Vào học ngay" : "Continue"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 1 && (
                  /* Feature 1: Mirror Mode Webcam Studio */
                  <div className="h-full w-full bg-ink-900 p-3 sm:p-4 flex flex-col justify-between text-white select-none">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-ink-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                        <span className="font-bold text-ink-200">
                          {lang === "vi" ? "Chế độ Soi Gương Đôi (Mirror Mode)" : "Side-by-side Mirror Mode"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-ink-800 text-[10px] font-mono text-sky-400 border border-ink-700">
                          {lang === "vi" ? "Độ trễ: 28ms" : "Latency: 28ms"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-brand-950/80 text-brand-400 text-[10px] font-bold border border-brand-800">
                          Khớp: 99.4%
                        </span>
                      </div>
                    </div>

                    {/* Split Viewport */}
                    <div className="grid grid-cols-2 gap-3 my-2 flex-1 items-stretch">
                      {/* Left: Native Model Demo */}
                      <div className="bg-ink-800/90 rounded-xl p-2.5 border border-ink-700 relative flex flex-col items-center justify-center">
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-ink-300">
                          {lang === "vi" ? "Video Mẫu 1080p (Thầy Minh)" : "1080p Native Demo"}
                        </span>
                        <div className="w-16 h-16 rounded-full bg-ink-700 flex items-center justify-center text-ink-300 font-bold text-sm mb-1 border border-ink-600">
                          TM
                        </div>
                        <p className="text-xs font-bold text-ink-200">
                          {lang === "vi" ? "Ký hiệu: Cảm ơn" : "Sign: Thank you"}
                        </p>
                        <p className="text-[10px] text-ink-400 text-center mt-0.5">
                          {lang === "vi" ? "Chạm cằm đưa dứt khoát về phía trước" : "Touch chin, move forward"}
                        </p>
                      </div>

                      {/* Right: User Webcam with Landmark Overlay */}
                      <div className="bg-ink-900 rounded-xl p-2.5 border border-brand-500 relative flex flex-col items-center justify-center overflow-hidden">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-300 to-transparent animate-scan-line pointer-events-none" />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-600 text-[9px] font-bold text-white">
                          {lang === "vi" ? "Webcam của bạn (Trực tiếp)" : "Your Webcam (Live)"}
                        </span>

                        {/* Hand Landmarks Visualization */}
                        <div className="w-16 h-16 relative flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-brand-500">
                            <g stroke="var(--color-sky-400)" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="50" y1="85" x2="35" y2="65" />
                              <line x1="50" y1="85" x2="50" y2="55" />
                              <line x1="50" y1="85" x2="65" y2="65" />
                              <line x1="35" y1="65" x2="25" y2="45" />
                              <line x1="50" y1="55" x2="50" y2="30" />
                              <line x1="65" y1="65" x2="75" y2="45" />
                            </g>
                            <circle cx="50" cy="85" r="3.5" fill="var(--color-sky-500)" />
                            <circle cx="25" cy="45" r="3" fill="var(--color-brand-500)" />
                            <circle cx="50" cy="30" r="3" fill="var(--color-brand-500)" />
                            <circle cx="75" cy="45" r="3" fill="var(--color-brand-500)" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-brand-400 mt-1">
                          {lang === "vi" ? "Đúng hình tay & vị trí" : "Accurate Handshape"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-ink-800/80 rounded-lg px-3 py-1.5 text-[11px] text-ink-300 flex items-center justify-between border border-ink-700">
                      <span>{lang === "vi" ? "Phím tắt: [Space] Quay lại · [N] Bài tiếp theo" : "Shortcuts: [Space] Replay · [N] Next"}</span>
                      <span className="text-sky-400 font-bold">{lang === "vi" ? "21 Khớp đang theo dõi" : "21 Hand Joints"}</span>
                    </div>
                  </div>
                )}

                {activeTab === 2 && (
                  /* Feature 2: 400-Sign Fast Dictionary */
                  <div className="h-full w-full bg-ink-50 p-4 sm:p-6 flex flex-col justify-between select-none">
                    {/* Search Bar */}
                    <div>
                      <div className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-brand-500 shadow-xs">
                        <svg className="w-4 h-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-ink-900 flex-1">
                          {lang === "vi" ? "xin chao" : "hello"}
                        </span>
                        <span className="text-[10px] font-mono text-ink-600 bg-ink-100 px-2 py-0.5 rounded border border-ink-200">
                          Ctrl + K
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-600 mt-1.5 ml-1">
                        {lang === "vi" ? "Tìm thấy 3 kết quả từ 400 ký hiệu chuẩn VSL:" : "Found 3 results across 400 VSL signs:"}
                      </p>
                    </div>

                    {/* Search Results List */}
                    <div className="grid grid-cols-3 gap-2.5 my-2">
                      <div className="bg-white rounded-xl p-3 border border-brand-500 shadow-xs">
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded block w-fit mb-1">
                          Hà Nội · TP.HCM
                        </span>
                        <h5 className="text-xs sm:text-sm font-bold text-ink-900">
                          {lang === "vi" ? "Xin chào" : "Hello"}
                        </h5>
                        <p className="text-[10px] text-ink-600 mt-0.5">
                          {lang === "vi" ? "24 Video mẫu HD" : "24 HD Demo Clips"}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-brand-500">
                          {lang === "vi" ? "Xem video →" : "Watch video →"}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-ink-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-ink-600 bg-ink-100 px-1.5 py-0.5 rounded block w-fit mb-1">
                          {lang === "vi" ? "Toàn quốc" : "Nationwide"}
                        </span>
                        <h5 className="text-xs sm:text-sm font-bold text-ink-900">
                          {lang === "vi" ? "Chào buổi sáng" : "Good morning"}
                        </h5>
                        <p className="text-[10px] text-ink-600 mt-0.5">
                          {lang === "vi" ? "18 Video mẫu HD" : "18 HD Demo Clips"}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-ink-600">
                          {lang === "vi" ? "Xem video →" : "Watch video →"}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl p-3 border border-ink-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-ink-600 bg-ink-100 px-1.5 py-0.5 rounded block w-fit mb-1">
                          Đà Nẵng
                        </span>
                        <h5 className="text-xs sm:text-sm font-bold text-ink-900">
                          {lang === "vi" ? "Chào bạn" : "Greetings friend"}
                        </h5>
                        <p className="text-[10px] text-ink-600 mt-0.5">
                          {lang === "vi" ? "12 Video mẫu HD" : "12 HD Demo Clips"}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-ink-600">
                          {lang === "vi" ? "Xem video →" : "Watch video →"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 border border-ink-200 flex items-center justify-between text-[11px] text-ink-700">
                      <span>{lang === "vi" ? "Tốc độ phát: 0.5x · 0.75x · 1.0x (Có góc quay nghiêng & chính diện)" : "Playback: 0.5x · 0.75x · 1.0x with multi-angle views"}</span>
                      <span className="font-bold text-brand-500">{lang === "vi" ? "Tra cứu 100% miễn phí" : "100% Free"}</span>
                    </div>
                  </div>
                )}

                {activeTab === 3 && (
                  /* Feature 3: Spaced Repetition Flashcards */
                  <div className="h-full w-full bg-ink-50 p-4 sm:p-6 flex flex-col justify-between select-none">
                    <div className="flex items-center justify-between pb-2 border-b border-ink-200">
                      <div>
                        <span className="text-[11px] font-bold text-brand-600 block">
                          {lang === "vi" ? "Ghi Nhớ Ngắt Quãng (Spaced Repetition)" : "Spaced Repetition Algorithm"}
                        </span>
                        <h4 className="text-sm font-bold text-ink-900">
                          {lang === "vi" ? "Hôm nay cần ôn: 12 từ chưa vững" : "Today: 12 cards due for review"}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-brand-500 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200">
                        {lang === "vi" ? "Thẻ 4/12" : "Card 4/12"}
                      </span>
                    </div>

                    {/* Central Interactive Flashcard */}
                    <div className="my-2 bg-white rounded-2xl p-4 border border-brand-500 shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-sun-700 bg-sun-50 px-2 py-0.5 rounded border border-sun-200">
                          {lang === "vi" ? "Ký hiệu cần củng cố" : "Needs Reinforcement"}
                        </span>
                        <h5 className="text-lg font-semibold text-ink-900 mt-1">Yêu thương (Love)</h5>
                        <p className="text-xs text-ink-600 mt-0.5">
                          {lang === "vi" ? "Hai tay bắt chéo trước ngực, bàn tay nắm nhẹ" : "Cross forearms over chest, light fists"}
                        </p>
                      </div>
                      <div className="w-16 h-16 rounded-xl bg-ink-900 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        HD 1080p
                      </div>
                    </div>

                    {/* Spaced Interval Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button className="p-2 rounded-xl border border-danger-200 bg-danger-50 text-danger-700 text-center font-bold text-[11px]">
                        {lang === "vi" ? "Chưa thuộc (+1 ngày)" : "Again (+1 day)"}
                      </button>
                      <button className="p-2 rounded-xl border border-sun-200 bg-sun-50 text-sun-700 text-center font-bold text-[11px]">
                        {lang === "vi" ? "Tạm ổn (+3 ngày)" : "Good (+3 days)"}
                      </button>
                      <button className="p-2 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-center font-bold text-[11px]">
                        {lang === "vi" ? "Rất dễ (+7 ngày)" : "Easy (+7 days)"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 4 && (
                  /* Feature 4: Client-Side Security */
                  <div className="h-full w-full bg-ink-900 p-4 sm:p-6 flex flex-col justify-between text-white select-none">
                    <div className="flex items-center justify-between pb-3 border-b border-ink-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
                          <IconShield className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ink-100">
                            {lang === "vi" ? "Kiến Trúc Bảo Mật Trực Tiếp Trên Trình Duyệt" : "On-Device Client Privacy Architecture"}
                          </h4>
                          <span className="text-[10px] text-ink-400">Zero Cloud Video Streaming Policy</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-brand-950 text-brand-400 text-[10px] font-bold border border-brand-800">
                        100% Client-Side
                      </span>
                    </div>

                    {/* Architecture Flow */}
                    <div className="grid grid-cols-3 gap-2.5 my-3 text-center">
                      <div className="bg-ink-800/90 rounded-xl p-3 border border-ink-700">
                        <div className="w-8 h-8 rounded-lg bg-ink-700 mx-auto flex items-center justify-center text-sky-400 mb-1.5">
                          <IconWebcam className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-ink-200">
                          {lang === "vi" ? "1. Webcam Laptop" : "1. Laptop Webcam"}
                        </p>
                        <p className="text-[10px] text-ink-400 mt-0.5">
                          {lang === "vi" ? "Thu nhận khung hình nội bộ" : "Local stream only"}
                        </p>
                      </div>

                      <div className="bg-ink-800/90 rounded-xl p-3 border border-brand-500">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/20 mx-auto flex items-center justify-center text-brand-300 mb-1.5 font-mono text-xs font-bold">
                          WASM
                        </div>
                        <p className="text-xs font-bold text-brand-300">
                          {lang === "vi" ? "2. AI WebAssembly" : "2. In-Browser AI"}
                        </p>
                        <p className="text-[10px] text-ink-400 mt-0.5">
                          {lang === "vi" ? "Trích xuất 21 điểm xương tay" : "Extracts 21 joints"}
                        </p>
                      </div>

                      <div className="bg-ink-800/90 rounded-xl p-3 border border-ink-700">
                        <div className="w-8 h-8 rounded-lg bg-ink-700 mx-auto flex items-center justify-center text-brand-400 mb-1.5 font-bold text-xs">
                          ✓
                        </div>
                        <p className="text-xs font-bold text-ink-200">
                          {lang === "vi" ? "3. Chấm Điểm Tức Thì" : "3. Instant Score"}
                        </p>
                        <p className="text-[10px] text-ink-400 mt-0.5">
                          {lang === "vi" ? "Không lưu lại hình ảnh" : "Zero pixel stored"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-ink-800/60 rounded-xl p-2.5 text-[11px] text-ink-300 flex items-center justify-between border border-ink-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        {lang === "vi" ? "Không có dữ liệu video nào rời khỏi thiết bị cá nhân của bạn." : "No video frames ever leave your personal computer."}
                      </span>
                      <span className="text-sky-400 font-bold">Privacy First</span>
                    </div>
                  </div>
                )}
              </BrowserMockup>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
