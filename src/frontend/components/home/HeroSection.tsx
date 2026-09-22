"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { BrowserMockup } from "@/components/ui/BrowserMockup";
import { IconWebcam, IconBook, IconShield } from "@/components/ui/Icons";

interface HeroSectionProps {
  lang: "en" | "vi";
}

export function HeroSection({ lang }: HeroSectionProps) {
  const [activeSign, setActiveSign] = useState<number>(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState<number>(99.4);

  const signs = [
    {
      wordVi: "Cảm ơn",
      wordEn: "Thank you",
      accuracy: 99.4,
      modelVi: "Người mẫu bản ngữ #001",
      modelEn: "Native Signer #001",
      instructionVi:
        "Bàn tay chạm nhẹ cằm rồi đưa ra phía trước — Lời tri ân dịu dàng gửi đến người luôn đồng hành cùng bạn.",
      instructionEn:
        "Touch chin lightly then move hand forward — A gentle word of gratitude to those by your side.",
      feedbackVi: "Chuẩn vị trí tiếp xúc cằm & góc đưa tay.",
      feedbackEn: "Accurate chin contact & forward projection angle.",
      actionType: "forward",
    },
    {
      wordVi: "Xin lỗi",
      wordEn: "Sorry",
      accuracy: 98.6,
      modelVi: "Người mẫu bản ngữ #002",
      modelEn: "Native Signer #002",
      instructionVi:
        "Bàn tay đặt nhẹ lên ngực áo — Sự chân thành xóa tan mọi hiểu lầm vô ý trong đời sống thường nhật.",
      instructionEn:
        "Place hand gently over chest — Sincere warmth dissolving everyday misunderstandings.",
      feedbackVi: "Khớp chuẩn quỹ đạo xoay bàn tay trên ngực.",
      feedbackEn: "Matched circular path over chest perfectly.",
      actionType: "circle",
    },
    {
      wordVi: "Yêu thương",
      wordEn: "Love",
      accuracy: 100,
      modelVi: "Người mẫu bản ngữ #003",
      modelEn: "Native Signer #003",
      instructionVi:
        "Hai tay bắt chéo ôm trọn trước ngực — Một cái ôm ấm áp không cần đến tiếng nói.",
      instructionEn:
        "Arms crossed embracing the chest — A warm hug that needs no spoken words.",
      feedbackVi: "Khớp hoàn hảo biên độ và khoảng cách hai tay.",
      feedbackEn: "Perfect posture span and wrist crossing distance.",
      actionType: "cross",
    },
  ];

  const current = signs[activeSign];

  // Animate accuracy counter when switching words
  useEffect(() => {
    setAnimatedAccuracy(75);
    const timer = setTimeout(() => {
      setAnimatedAccuracy(current.accuracy);
    }, 280);
    return () => clearTimeout(timer);
  }, [activeSign, current.accuracy]);

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:py-16 lg:py-20 bg-[#F4EFE6]">
      {/* Soft Teal and Warm Pastel Background Ambient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#ccfbf1]/40 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-[#FEF3C7]/40 blur-3xl -z-10 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline & Action */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <ScrollReveal direction="up" delayMs={0}>
              {/* Official Accreditation Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f7f8] border border-[#b2e7e9] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#0d9fa5] animate-pulse" />
                <span className="text-xs font-bold text-[#08757a] tracking-tight">
                  {lang === "vi"
                    ? "Nhịp cầu yêu thương bằng Ngôn ngữ Ký hiệu Việt Nam (VSL)"
                    : "Bridge of Love Through Vietnamese Sign Language (VSL)"}
                </span>
              </div>
            </ScrollReveal>

            {/* Main Standardized Heading */}
            <ScrollReveal direction="up" delayMs={100}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15] mb-5">
                {lang === "vi" ? (
                  <>
                    Đừng Để Yêu Thương{" "}
                    <span className="text-[#0d9fa5] block mt-1">
                      Dừng Lại Ở Khoảng Lặng.
                    </span>
                  </>
                ) : (
                  <>
                    Don&apos;t Let Love{" "}
                    <span className="text-[#0d9fa5] block mt-1">
                      Pause in the Silence.
                    </span>
                  </>
                )}
              </h1>
            </ScrollReveal>

            {/* Subtitle describing Mirror Mode & 21 landmarks */}
            <ScrollReveal direction="up" delayMs={200}>
              <p className="text-base sm:text-lg text-[#475569] font-normal leading-relaxed max-w-xl mb-8">
                {lang === "vi"
                  ? "Bật máy tính lên và học cách cất lời bằng đôi bàn tay ngay hôm nay. Với chế độ Soi gương đôi (Mirror Mode), bạn vừa quan sát người mẫu Điếc bản ngữ làm mẫu, vừa tự do nắn chỉnh từng cử chỉ của chính mình. Tự tin xóa nhòa khoảng cách với người thân yêu chỉ sau 10 phút luyện tập mỗi ngày!"
                  : "Open your desktop and learn to speak with your hands today. With dual Mirror Mode, observe native Deaf signers while adjusting your own gestures in real time. Gain the confidence to bridge the distance with loved ones in just 10 minutes a day!"}
              </p>
            </ScrollReveal>

            {/* Action Buttons */}
            <ScrollReveal direction="up" delayMs={300}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/dang-ky"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-[0_4px_16px_rgba(13,159,165,0.3)] hover:shadow-[0_6px_22px_rgba(13,159,165,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>
                    {lang === "vi" ? "Bắt đầu hành trình kết nối (Miễn phí)" : "Begin Your Journey to Connect (Free)"}
                  </span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  href="/luyen-ai"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-semibold text-[#0F172A] bg-white border border-[#E2DBD0] hover:bg-[#F4EFE6] transition-colors shadow-xs"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9fa5] animate-ping" />
                  <span>
                    {lang === "vi" ? "Thử cử chỉ đầu tiên trước màn hình" : "Try Your First Sign on Screen"}
                  </span>
                </Link>
              </div>
            </ScrollReveal>

            {/* 3 Core Value Propositions */}
            <ScrollReveal direction="up" delayMs={400}>
              <div className="mt-8 pt-6 border-t border-[#E2DBD0] grid grid-cols-1 gap-2.5 text-xs font-semibold text-[#475569] w-full">
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-md bg-[#e6f7f8] text-[#0d9fa5] border border-[#b2e7e9] shrink-0">
                    <IconBook className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    {lang === "vi"
                      ? "400 Ký hiệu chuẩn hóa chia theo 12 chủ đề đời sống thiết thực"
                      : "400 Core signs structured into 12 practical units"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-md bg-[#e6f7f8] text-[#0d9fa5] border border-[#b2e7e9] shrink-0">
                    <IconWebcam className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    {lang === "vi"
                      ? "24.700+ Video mẫu Full HD từ 24 người mẫu ký hiệu Điếc bản ngữ"
                      : "24,700+ Full HD video demos by 24 native Deaf signers"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-md bg-[#e6f7f8] text-[#0d9fa5] border border-[#b2e7e9] shrink-0">
                    <IconShield className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    {lang === "vi"
                      ? "Bảo mật 100%: AI chạy trực tiếp trên trình duyệt máy tính, không tải video lên máy chủ"
                      : "100% In-browser privacy: zero video data sent to cloud servers"}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Desktop Laptop/Browser Mockup with Mirror Mode View */}
          <div className="lg:col-span-6 flex justify-center relative">
            <ScrollReveal direction="up" delayMs={150} className="w-full">
              <div className="relative">
                {/* Floating Streak Badge: Warm amber number pill 7, no flame emoji */}
                <div className="absolute -top-4 -left-2 sm:-left-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-[#E2DBD0] flex items-center gap-3 animate-float-slow select-none">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] font-extrabold text-base flex items-center justify-center shrink-0">
                    7
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      {lang === "vi" ? "Chuỗi 7 Ngày!" : "7-Day Streak!"}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {lang === "vi" ? "Chỉ 10 phút luyện tập mỗi ngày" : "10 mins daily goal met"}
                    </p>
                  </div>
                </div>

                {/* Floating Hand Landmarks Badge: Teal pill 21, no emoji */}
                <div className="absolute -bottom-4 -right-2 sm:-right-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-[#E2DBD0] flex items-center gap-3 animate-float-reverse select-none">
                  <div className="w-9 h-9 rounded-xl bg-[#e6f7f8] border border-[#b2e7e9] text-[#0d9fa5] font-extrabold text-sm flex items-center justify-center shrink-0">
                    21
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#08757a]">
                      {lang === "vi" ? "21 Điểm Xương Tay" : "21 Hand Landmarks"}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {lang === "vi" ? "Nhận diện chuyển động tức thì (< 35ms)" : "Sub-35ms motion tracking"}
                    </p>
                  </div>
                </div>

                {/* Desktop Browser Mockup Frame */}
                <BrowserMockup url="signlight.vn/luyen-ai" className="w-full shadow-2xl">
                  {/* Inside Browser: Dark Studio Canvas for Mirror Mode */}
                  <div className="h-full w-full bg-[#0F172A] p-3 sm:p-4 flex flex-col justify-between text-white select-none">
                    {/* Top Status Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-200">
                          {lang === "vi" ? "Mirror Mode: Soi Gương Đôi" : "Mirror Mode: Dual View"}
                        </span>
                        <span className="hidden sm:inline-block text-[10px] text-slate-400">
                          · {lang === "vi" ? current.modelVi : current.modelEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-[#38bdf8] border border-slate-700">
                          &lt; 35ms
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                          {animatedAccuracy}%
                        </span>
                      </div>
                    </div>

                    {/* Split Viewport: Left Native Signer Demo, Right User Webcam */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-2 flex-1 items-stretch">
                      {/* Left: Native Model Demo (100% human representation) */}
                      <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700 relative flex flex-col justify-between overflow-hidden">
                        <div className="flex items-center justify-between z-10">
                          <span className="px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-slate-300">
                            1080p Full HD
                          </span>
                          <span className="text-[9px] font-bold text-[#38bdf8]">
                            1.0x
                          </span>
                        </div>

                        {/* Portrait & Hand Motion Graphic */}
                        <div className="flex flex-col items-center my-1 z-10">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-200 font-bold text-xs sm:text-sm shadow-inner">
                            VSL
                          </div>
                          <p className="text-xs sm:text-sm font-extrabold text-white mt-1.5 tracking-wide">
                            {lang === "vi" ? current.wordVi : current.wordEn}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-slate-300 text-center leading-tight mt-0.5 line-clamp-2 px-1">
                            {lang === "vi" ? current.instructionVi : current.instructionEn}
                          </p>
                        </div>

                        <div className="z-10 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-700/60">
                          <span>{lang === "vi" ? current.modelVi : current.modelEn}</span>
                          <span className="text-[#2dd4bf]">
                            {lang === "vi" ? "Đúng chuẩn VSL" : "Standard VSL"}
                          </span>
                        </div>
                      </div>

                      {/* Right: Live Webcam Feed with Landmark Overlay and Scan line */}
                      <div className="bg-slate-900 rounded-xl p-2.5 border border-[#0d9fa5] relative flex flex-col justify-between overflow-hidden">
                        {/* Live Scanning Line Animation */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2dd4bf] to-transparent animate-scan-line pointer-events-none z-20" />

                        <div className="flex items-center justify-between z-10">
                          <span className="px-1.5 py-0.5 rounded bg-[#08757a] text-[9px] font-bold text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Webcam
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">
                            21 Joints
                          </span>
                        </div>

                        {/* 21 Hand Landmarks Skeleton Visualization */}
                        <div className="w-full flex items-center justify-center my-1 z-10">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full text-[#0d9fa5] animate-sign-pulse"
                            >
                              {/* Bones */}
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
                                <line x1="32" y1="68" x2="22" y2="54" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="22" y1="54" x2="16" y2="42" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="42" y1="58" x2="38" y2="40" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="38" y1="40" x2="36" y2="24" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="52" y1="56" x2="51" y2="36" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="51" y1="36" x2="50" y2="20" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="62" y1="58" x2="64" y2="38" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="64" y1="38" x2="66" y2="22" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="72" y1="66" x2="76" y2="50" stroke="#0d9fa5" strokeWidth="3" />
                                <line x1="76" y1="50" x2="80" y2="34" stroke="#0d9fa5" strokeWidth="3" />
                              </g>
                              {/* Joint Nodes */}
                              <g fill="#0284C7">
                                <circle cx="50" cy="88" r="4" fill="#0284C7" />
                                <circle cx="32" cy="68" r="3" />
                                <circle cx="42" cy="58" r="3" />
                                <circle cx="52" cy="56" r="3" />
                                <circle cx="62" cy="58" r="3" />
                                <circle cx="72" cy="66" r="3" />
                              </g>
                              {/* Fingertips in Oceanic Teal */}
                              <g fill="#0d9fa5">
                                <circle cx="16" cy="42" r="3.5" />
                                <circle cx="36" cy="24" r="3.5" />
                                <circle cx="50" cy="20" r="3.5" />
                                <circle cx="66" cy="22" r="3.5" />
                                <circle cx="80" cy="34" r="3.5" />
                              </g>
                            </svg>
                          </div>
                        </div>

                        {/* Real-time AI Evaluation Message */}
                        <div className="z-10 bg-emerald-950/90 rounded-lg p-1 text-[9px] sm:text-[10px] text-emerald-300 text-center font-medium border border-emerald-800">
                          {lang === "vi" ? current.feedbackVi : current.feedbackEn}
                        </div>
                      </div>
                    </div>

                    {/* Sign Selector Tabs */}
                    <div className="flex gap-1.5 pt-1">
                      {signs.map((s, idx) => (
                        <button
                          key={s.wordEn}
                          onClick={() => setActiveSign(idx)}
                          className={`flex-1 py-1.5 px-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            activeSign === idx
                              ? "bg-[#0d9fa5] text-white shadow-xs"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {lang === "vi" ? s.wordVi : s.wordEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </BrowserMockup>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
