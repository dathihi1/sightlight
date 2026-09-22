"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import {
  IconWebcam,
  IconBook,
  IconCards,
  IconGrid,
} from "@/components/ui/Icons";

interface CoreFeaturesProps {
  lang: "en" | "vi";
}

export function CoreFeatures({ lang }: CoreFeaturesProps) {
  // State for Block 2: 3 Regional Advisors
  const [activeAdvisor, setActiveAdvisor] = useState<number>(0);
  const advisors = [
    {
      name: "Thầy Minh",
      regionVi: "VSL Miền Bắc (Hà Nội)",
      regionEn: "Northern VSL (Hanoi)",
      roleVi: "Cố vấn ký hiệu học đường & từ vựng chuẩn quốc gia",
      roleEn: "Academic sign & national standard vocabulary advisor",
      initials: "TM",
      quoteVi:
        "Chuẩn hóa 400 ký hiệu cốt lõi theo Bộ GD&ĐT giúp người học có nền tảng vững vàng, dễ tiếp cận văn hóa người Điếc.",
      quoteEn:
        "Standardizing 400 core signs with educational curricula provides a solid foundation for engaging Deaf culture.",
    },
    {
      name: "Cô Lan",
      regionVi: "VSL Miền Nam (TP.HCM)",
      regionEn: "Southern VSL (HCMC)",
      roleVi: "Chuyên gia văn hóa giao tiếp & sắc thái biểu cảm",
      roleEn: "Cultural communication specialist & facial expression coach",
      initials: "CL",
      quoteVi:
        "Màn hình máy tính rộng giúp quan sát trọn vẹn ngữ điệu và biểu cảm khuôn mặt — chìa khóa của ngôn ngữ ký hiệu sống động.",
      quoteEn:
        "A wide desktop screen lets you catch subtle facial nuances and body phrasing — the heart of expressive sign language.",
    },
    {
      name: "Hoàng Nam",
      regionVi: "VSL Miền Trung (Đà Nẵng)",
      regionEn: "Central VSL (Da Nang)",
      roleVi: "Cố vấn phương ngữ & tình huống giao tiếp đời thường",
      roleEn: "Regional dialect advisor & real-life dialogue coach",
      initials: "HN",
      quoteVi:
        "Luyện tập 12 chủ đề thiết thực trên máy tính giúp học viên tự tin đối thoại tại mọi miền đất nước.",
      quoteEn:
        "Practicing 12 everyday units on desktop equips learners to converse with confidence anywhere across Vietnam.",
    },
  ];

  // State for Block 3: Interactive Lesson Types
  const [activeLessonType, setActiveLessonType] = useState<number>(0);
  const lessonTypes = [
    {
      id: "mirror",
      nameVi: "Phòng luyện Mirror Mode",
      nameEn: "Mirror Mode Practice",
      Icon: IconWebcam,
      descVi: "Chấm cử chỉ động trực tiếp qua webcam với độ trễ < 35ms",
      descEn: "Evaluate dynamic sign motions via webcam at sub-35ms latency",
      previewTextVi: "Thực hành: 'Cảm ơn'",
      previewTextEn: "Sign: 'Thank you'",
      badgeVi: "Webcam AI tức thì",
      badgeEn: "Instant Webcam AI",
    },
    {
      id: "flashcard",
      nameVi: "Thẻ từ vựng video vòng lặp",
      nameEn: "Looping Video Flashcards",
      Icon: IconCards,
      descVi: "Video người thật Full HD lặp lại liên tục kèm ghi chú vị trí ngón tay",
      descEn: "Full HD human video clips looping smoothly with handshape notes",
      previewTextVi: "Unit 1: 'Bữa cơm gia đình'",
      previewTextEn: "Unit 1: 'Family Dinner'",
      badgeVi: "Ghi nhớ ngắt quãng",
      badgeEn: "Spaced Repetition",
    },
    {
      id: "quiz",
      nameVi: "Trắc nghiệm ngữ pháp VSL",
      nameEn: "VSL Grammar Quizzes",
      Icon: IconBook,
      descVi: "Bài tập sắp xếp trật tự từ và đối thoại hai chiều theo ngữ pháp VSL",
      descEn: "Sentence-reordering and two-way dialogue quizzes in VSL syntax",
      previewTextVi: "Chọn câu phản hồi đúng",
      previewTextEn: "Select proper response",
      badgeVi: "Luyện tư duy",
      badgeEn: "Syntax Mastery",
    },
    {
      id: "topics",
      nameVi: "12 Unit theo chủ đề",
      nameEn: "12 Real-Life Units",
      Icon: IconGrid,
      descVi: "Từ mâm cơm gia đình, trường học đến y tế, ngân hàng và thời tiết",
      descEn: "From family dining and school to healthcare, banking, and weather",
      previewTextVi: "400 Ký hiệu chuẩn hóa",
      previewTextEn: "400 Standardized Signs",
      badgeVi: "Lộ trình hoàn chỉnh",
      badgeEn: "Complete Curriculum",
    },
  ];

  return (
    <section className="py-16 sm:py-24 space-y-24 sm:space-y-32 bg-[#F4EFE6]">
      {/* Intro Header */}
      <div className="mx-auto max-w-3xl text-center px-4">
        <ScrollReveal direction="up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-4 border border-[#b2e7e9]">
            {lang === "vi"
              ? "Biến Tính Năng Thành Câu Chuyện Thấu Hiểu"
              : "Turning Features into Stories of Understanding"}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
            {lang === "vi"
              ? "Học Bằng Sự Thấu Cảm, Tự Tin Qua Từng Cử Chỉ"
              : "Learn with Empathy, Gain Confidence Through Every Sign"}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
            {lang === "vi"
              ? "Không áp lực, không phán xét. Từng cử động và bài học tại SignLight được chuẩn bị chu đáo để bạn vững bước kết nối cùng người thân yêu."
              : "No pressure, no judgment. Every gesture and lesson at SignLight is thoughtfully prepared so you can warmly connect with loved ones."}
          </p>
        </ScrollReveal>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-20 sm:space-y-28">
        {/* ========================================================= */}
        {/* BLOCK 1: Mirror Mode on Desktop Browser */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <ScrollReveal direction="up" delayMs={0}>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider border border-[#b2e7e9]">
                {lang === "vi"
                  ? "Chế độ Soi gương (Mirror Mode)"
                  : "Dual Mirror Mode"}
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] mt-2 leading-tight">
                {lang === "vi"
                  ? "Như có người cầm tay chỉ việc"
                  : "Like a Caring Mentor Guiding Your Hands"}
              </h3>
              <p className="text-[#475569] text-base sm:text-lg leading-relaxed mt-3">
                {lang === "vi"
                  ? "Không còn nỗi hoang mang tự hỏi: \"Liệu mình làm thế này người ta có hiểu không?\". Màn hình chia đôi giúp bạn thấy hình ảnh của mình song song với người bản ngữ. Hệ thống sẽ dịu dàng nhắc nhở khi góc tay chưa chuẩn, giúp bạn vững tâm luyện tập cho đến khi cử chỉ mềm mại và tự nhiên nhất."
                  : "No more feeling lost wondering: 'Will people understand my signing?'. The dual-split screen places your reflection side-by-side with native Deaf instructors. The system gently guides you when hand angles need adjustment, keeping you encouraged until gestures feel natural and graceful."}
              </p>
              <p className="text-[#475569] text-sm sm:text-base leading-relaxed">
                {lang === "vi"
                  ? "Bảo mật tuyệt đối: Toàn bộ quá trình soi chiếu diễn ra an toàn ngay trên máy tính của bạn — không một khung hình camera nào được gửi ra ngoài, nâng niu trọn vẹn sự riêng tư của góc học tập."
                  : "100% Client-side privacy: Verification runs locally and safely on your device — zero camera frames leave your computer, safeguarding your private study sanctuary."}
              </p>
              <div className="pt-2">
                <Link
                  href="/luyen-ai"
                  className="inline-flex items-center gap-2 text-base font-bold text-[#0d9fa5] hover:text-[#0a8287] hover:underline"
                >
                  <span>
                    {lang === "vi"
                      ? "Trải nghiệm Soi gương cùng webcam"
                      : "Experience Mirror Mode on Webcam"}
                  </span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Visual: Desktop Split-Screen Panel Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <ScrollReveal direction="up" delayMs={150}>
              <div className="w-full max-w-lg bg-[#0F172A] rounded-3xl p-3 shadow-2xl border border-slate-700">
                {/* Window Chrome Header */}
                <div className="px-4 py-2.5 bg-slate-800 rounded-t-2xl flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">
                      Mirror Mode · {lang === "vi" ? "Đang luyện tập song song" : "Side-by-side verification"}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    28ms · 60 FPS
                  </span>
                </div>

                {/* Split Screen 2 Panes */}
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-900 rounded-b-2xl">
                  {/* Left Pane: Teacher Video Clip */}
                  <div className="bg-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between relative min-h-[220px] border border-slate-700/60">
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-bold text-amber-300">
                        {lang === "vi" ? "Video mẫu chuẩn VSL" : "Native VSL Demo"}
                      </span>
                      <span className="text-[10px] text-slate-400">1080p</span>
                    </div>

                    {/* Instructor Landmark Hand Animation */}
                    <div className="my-auto py-2 flex flex-col items-center">
                      <svg viewBox="0 0 100 100" className="w-24 h-24 text-[#0d9fa5] animate-sign-pulse">
                        <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
                          <line x1="50" y1="88" x2="32" y2="68" />
                          <line x1="50" y1="88" x2="42" y2="58" />
                          <line x1="50" y1="88" x2="52" y2="56" />
                          <line x1="50" y1="88" x2="62" y2="58" />
                          <line x1="50" y1="88" x2="72" y2="66" />
                          <line x1="32" y1="68" x2="42" y2="58" />
                          <line x1="42" y1="58" x2="52" y2="56" />
                          <line x1="52" y1="56" x2="62" y2="58" />
                          <line x1="62" y1="58" x2="72" y2="66" />
                          <line x1="42" y1="58" x2="38" y2="30" stroke="#0d9fa5" strokeWidth="3" />
                          <line x1="52" y1="56" x2="51" y2="24" stroke="#0d9fa5" strokeWidth="3" />
                          <line x1="62" y1="58" x2="65" y2="28" stroke="#0d9fa5" strokeWidth="3" />
                        </g>
                        <g fill="#0284C7">
                          <circle cx="50" cy="88" r="4" />
                          <circle cx="32" cy="68" r="3" />
                          <circle cx="42" cy="58" r="3" />
                          <circle cx="52" cy="56" r="3" />
                          <circle cx="62" cy="58" r="3" />
                          <circle cx="72" cy="66" r="3" />
                        </g>
                        <g fill="#0d9fa5">
                          <circle cx="38" cy="30" r="3.5" />
                          <circle cx="51" cy="24" r="3.5" />
                          <circle cx="65" cy="28" r="3.5" />
                        </g>
                      </svg>
                      <p className="text-xs font-bold text-white mt-1">
                        {lang === "vi" ? "Cảm ơn (Thank you)" : "Thank you"}
                      </p>
                    </div>

                    <div className="w-full text-center py-1 bg-black/40 rounded text-[10px] text-slate-300">
                      {lang === "vi" ? "Chạm ngón vào cằm, đưa tới trước" : "Touch chin, move forward"}
                    </div>
                  </div>

                  {/* Right Pane: User Webcam View */}
                  <div className="bg-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between relative min-h-[220px] border border-slate-700/60">
                    <div className="w-full flex items-center justify-between">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Webcam Live
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">99.4%</span>
                    </div>

                    {/* User Hand with Live Landmark Scan */}
                    <div className="my-auto py-2 flex flex-col items-center relative">
                      <div className="w-24 h-24 rounded-2xl bg-slate-900/80 border border-slate-700 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0d9fa5] animate-scan-line shadow-[0_0_8px_#0d9fa5]" />
                        <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#0d9fa5] animate-wave-hand">
                          <g stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="50" y1="88" x2="38" y2="60" />
                            <line x1="50" y1="88" x2="52" y2="56" />
                            <line x1="50" y1="88" x2="64" y2="60" />
                            <line x1="38" y1="60" x2="36" y2="34" stroke="#2dd4bf" strokeWidth="3" />
                            <line x1="52" y1="56" x2="51" y2="28" stroke="#2dd4bf" strokeWidth="3" />
                            <line x1="64" y1="60" x2="65" y2="32" stroke="#2dd4bf" strokeWidth="3" />
                          </g>
                          <g fill="#2dd4bf">
                            <circle cx="36" cy="34" r="3" />
                            <circle cx="51" cy="28" r="3" />
                            <circle cx="65" cy="32" r="3" />
                          </g>
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-emerald-300 mt-1">
                        {lang === "vi" ? "Chuẩn góc cổ tay & vị trí" : "Correct angle & pose"}
                      </p>
                    </div>

                    <div className="w-full text-center py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-300 font-semibold">
                      {lang === "vi" ? "✓ 21 Khớp xương tay khớp hoàn toàn" : "✓ 21 Hand landmarks fully verified"}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCK 2: 12 Units Curriculum (Ending Dinner Table Syndrome) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Visual on Left: 12 Units Curriculum Desktop Card */}
          <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
            <ScrollReveal direction="up" delayMs={100}>
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E2DBD0] shadow-md space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#E2DBD0]">
                  <div>
                    <span className="text-xs font-bold text-[#08757a] uppercase tracking-wider block">
                      {lang === "vi" ? "Giáo trình 12 Unit" : "12-Unit Curriculum"}
                    </span>
                    <h4 className="text-base font-bold text-[#0F172A] mt-0.5">
                      {lang === "vi" ? "400 Ký Hiệu Đời Sống" : "400 Real-Life Signs"}
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#e6f7f8] text-[#0d9fa5] text-xs font-extrabold border border-[#b2e7e9]">
                    100% Full HD
                  </span>
                </div>

                {/* 12 Units Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { vi: "Gia đình", en: "Family", active: true },
                    { vi: "Ăn uống", en: "Dining", active: true },
                    { vi: "Chào hỏi", en: "Greetings", active: true },
                    { vi: "Trường học", en: "School", active: false },
                    { vi: "Nghề nghiệp", en: "Work", active: false },
                    { vi: "Thời tiết", en: "Weather", active: false },
                    { vi: "Đồ dùng", en: "Objects", active: false },
                    { vi: "Phương tiện", en: "Vehicles", active: false },
                    { vi: "Cảm xúc", en: "Emotions", active: false },
                    { vi: "Thời gian", en: "Time", active: false },
                    { vi: "Số đếm", en: "Numbers", active: false },
                    { vi: "Xã hội", en: "Community", active: false },
                  ].map((unit, idx) => (
                    <div
                      key={unit.en}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        unit.active
                          ? "bg-[#e6f7f8] border-[#0d9fa5] shadow-2xs"
                          : "bg-[#F8FAFC] border-[#E2DBD0] opacity-80"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-[#64748B] block">
                        U{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] block mt-0.5 truncate">
                        {lang === "vi" ? unit.vi : unit.en}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Unit 1 Spotlight */}
                <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E2DBD0]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#08757a]">
                      {lang === "vi" ? "Trọng tâm: Mâm Cơm Gia Đình" : "Focus: Family Dinner Table"}
                    </span>
                    <span className="font-mono text-[#64748B] text-[11px]">33 / 400 Ký hiệu</span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {lang === "vi"
                      ? "Bố, Mẹ, Con, Mời cơm, Uống nước, Ngon miệng, Yêu thương..."
                      : "Father, Mother, Children, Meal invitation, Drinking, Delicious, Love..."}
                  </p>
                </div>

                {/* Regional Advisors Selector */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#64748B] block mb-2 uppercase tracking-wider">
                    {lang === "vi" ? "Cố vấn người Điếc theo vùng miền:" : "Regional Deaf Advisors:"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {advisors.map((adv, i) => (
                      <button
                        key={adv.name}
                        onClick={() => setActiveAdvisor(i)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          activeAdvisor === i
                            ? "border-[#0d9fa5] bg-[#e6f7f8] shadow-xs"
                            : "border-[#E2DBD0] bg-white hover:bg-[#F4EFE6]"
                        }`}
                      >
                        <InitialsAvatar name={adv.name} size="sm" className="mx-auto mb-1" />
                        <span className="text-xs font-bold block text-[#0F172A] truncate">
                          {adv.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-white border border-[#E2DBD0] text-xs text-[#475569]">
                    <p className="font-bold text-[#08757a]">
                      {lang === "vi" ? advisors[activeAdvisor].roleVi : advisors[activeAdvisor].roleEn}
                    </p>
                    <p className="italic mt-1 leading-relaxed text-[#64748B]">
                      &quot;{lang === "vi" ? advisors[activeAdvisor].quoteVi : advisors[activeAdvisor].quoteEn}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Text on Right */}
          <div className="lg:col-span-6 space-y-5 order-1 lg:order-2">
            <ScrollReveal direction="up" delayMs={0}>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider border border-[#b2e7e9]">
                {lang === "vi" ? "12 Chủ Đề Giao Tiếp Đời Thường" : "12 Everyday Units"}
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] mt-2 leading-tight">
                {lang === "vi"
                  ? "Bắt đầu từ những điều giản dị quanh mâm cơm"
                  : "Beginning with the Simplicity of the Family Table"}
              </h3>
              <p className="text-[#475569] text-base sm:text-lg leading-relaxed mt-3">
                {lang === "vi"
                  ? "Không học những từ ngữ xa vời, SignLight đưa bạn về với những khoảnh khắc đời thường nhất: cách gọi Bố, gọi Mẹ, cách hỏi \"Cơm hôm nay vừa miệng không?\", cách nói \"Con thương cả nhà nhiều lắm\"... Để mâm cơm gia đình không còn những khoảng lặng ngậm ngùi."
                  : "Leaving behind abstract vocabulary, SignLight brings you directly to life's most meaningful moments: calling Mom and Dad, asking 'Is dinner delicious today?', saying 'I love our family so much'... So that family meals are never again left in wistful silence."}
              </p>
              <p className="text-[#475569] text-base leading-relaxed">
                {lang === "vi"
                  ? "Từng cử chỉ được đối chiếu cẩn trọng cùng các cố vấn người Điếc bản ngữ 3 miền Bắc – Trung – Nam, nắn nót chuẩn hóa để mỗi ký hiệu bạn gửi trao đều đong đầy sự chân thành và lòng trân trọng."
                  : "Every gesture is carefully refined alongside native Deaf advisors across Northern, Central, and Southern Vietnam, ensuring each sign you share conveys profound respect and sincerity."}
              </p>
              <div className="pt-2">
                <Link
                  href="/hoc"
                  className="inline-flex items-center gap-2 text-base font-bold text-[#0d9fa5] hover:text-[#0a8287] hover:underline"
                >
                  <span>
                    {lang === "vi" ? "Bắt đầu bài học đầu tiên" : "Start your first lesson"}
                  </span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCK 3: Interactive Practice Suite */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Text on Left */}
          <div className="lg:col-span-6 space-y-5">
            <ScrollReveal direction="up" delayMs={0}>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider border border-[#b2e7e9]">
                {lang === "vi" ? "Ôn Tập Nhẹ Nhàng & Bền Bỉ" : "Gentle Daily Practice"}
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] mt-2 leading-tight">
                {lang === "vi"
                  ? "Học mà như trò chuyện"
                  : "Learning as Naturally as a Conversation"}
              </h3>
              <p className="text-[#475569] text-base sm:text-lg leading-relaxed mt-3">
                {lang === "vi"
                  ? "Những video vòng lặp sắc nét quay chậm từng biểu cảm gương mặt và các câu đố tương tác giúp bạn ghi nhớ tự nhiên như cách một đứa trẻ học nói. Không áp lực điểm số, chỉ có niềm vui khi thấy đôi tay mình ngày một khéo léo hơn."
                  : "Crystal-clear looping videos slowly capturing subtle facial expressions and interactive mini-quizzes help you remember as naturally as a child learning to speak. Zero test anxiety, only the heartwarming joy of seeing your hands grow more expressive every day."}
              </p>
              <p className="text-[#475569] text-base leading-relaxed">
                {lang === "vi"
                  ? "Chỉ cần 10 phút ngồi trước màn hình mỗi ngày — lời nhắn gửi yêu thương được bạn chuẩn bị chu đáo sẽ sớm trở thành ngôn ngữ tự nhiên của trái tim."
                  : "Just 10 minutes at your computer every day — each thoughtful practice session transforms hesitation into the natural language of the heart."}
              </p>
              <div className="pt-2">
                <Link
                  href="/tu-dien"
                  className="inline-flex items-center gap-2 text-base font-bold text-[#0d9fa5] hover:text-[#0a8287] hover:underline"
                >
                  <span>
                    {lang === "vi" ? "Khám phá từ điển ký hiệu" : "Explore VSL dictionary"}
                  </span>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Interactive Lesson Type Showcase on Right */}
          <div className="lg:col-span-6 flex justify-center">
            <ScrollReveal direction="up" delayMs={150}>
              <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E2DBD0] shadow-sm">
                <div className="bg-[#F4EFE6] rounded-2xl p-5 border border-[#E2DBD0] mb-4 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#e6f7f8] text-[#0d9fa5] text-xs font-bold border border-[#b2e7e9]">
                      {lang === "vi"
                        ? lessonTypes[activeLessonType].badgeVi
                        : lessonTypes[activeLessonType].badgeEn}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B]">
                      {lang === "vi" ? "Chế độ Web Desktop" : "Web Desktop Mode"}
                    </span>
                  </div>

                  <div className="text-center py-6 bg-white rounded-xl border border-[#E2DBD0] transition-all">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e6f7f8] border border-[#b2e7e9] flex items-center justify-center text-[#0d9fa5] mb-3">
                      {(() => {
                        const Icon = lessonTypes[activeLessonType].Icon;
                        return <Icon className="w-7 h-7" />;
                      })()}
                    </div>
                    <p className="text-base font-bold text-[#0F172A]">
                      {lang === "vi"
                        ? lessonTypes[activeLessonType].previewTextVi
                        : lessonTypes[activeLessonType].previewTextEn}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1.5 px-4 leading-relaxed">
                      {lang === "vi"
                        ? lessonTypes[activeLessonType].descVi
                        : lessonTypes[activeLessonType].descEn}
                    </p>
                  </div>
                </div>

                {/* 4 Clickable Practice Type Buttons with Pure SVG Icons */}
                <div className="space-y-2">
                  {lessonTypes.map((type, idx) => {
                    const TypeIcon = type.Icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setActiveLessonType(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                          activeLessonType === idx
                            ? "border-[#0d9fa5] bg-[#e6f7f8] shadow-xs"
                            : "border-[#E2DBD0] bg-white hover:bg-[#F4EFE6]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="p-2 rounded-lg bg-[#F4EFE6] border border-[#E2DBD0] text-[#0d9fa5] shadow-2xs flex items-center justify-center">
                            <TypeIcon className="w-5 h-5" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#0F172A]">
                              {lang === "vi" ? type.nameVi : type.nameEn}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              {lang === "vi" ? type.descVi : type.descEn}
                            </p>
                          </div>
                        </div>
                        <svg
                          className={`w-4 h-4 text-[#0d9fa5] transition-transform ${
                            activeLessonType === idx ? "translate-x-1 opacity-100" : "opacity-0"
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
