"use client";

import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { IconWebcam } from "@/components/ui/Icons";

interface TestimonialsProps {
  lang: "en" | "vi";
}

export function Testimonials({ lang }: TestimonialsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const testimonials = [
    {
      id: 1,
      quoteVi:
        "Trước đây gia đình dùng điệu bộ tự chế rất vất vả. Mỗi tối, hai mẹ con lại mở laptop lên bàn học. Màn hình to giúp tôi nhìn rất rõ video người thật làm mẫu từng cử chỉ trong Unit Gia đình và Ăn uống. Nhờ chế độ Mirror Mode chấm điểm, tôi biết tay mình đã đặt đúng vị trí. Bữa cơm gia đình tôi giờ đã đầy ắp tiếng cười.",
      quoteEn:
        "Previously our family struggled with improvised gestures. Now every evening, my child and I open our laptop. The wide screen clearly shows native signers demonstrating signs in the Family and Dining units. Thanks to Mirror Mode scoring, I know my hands are properly positioned. Our family dinner table is now full of smiles.",
      author: "Nguyễn Thị Mai",
      age: "34 tuổi",
      location: "Đà Nẵng",
      roleVi: "Mẹ có con khiếm thính 6 tuổi",
      roleEn: "Mother of a 6-year-old Deaf child",
    },
    {
      id: 2,
      quoteVi:
        "Học trên web cực kỳ tiện vì không cần tải app nặng máy. Mình mở tab trình duyệt tại thư viện, bật webcam lên tự luyện 10 phút. AI nhận diện 21 điểm xương tay rất nhạy và chuẩn xác mà không hề bị giật lag máy.",
      quoteEn:
        "Learning in-browser is so convenient with zero app installation. I open a browser tab at the university library, turn on my webcam, and practice for 10 minutes. The AI tracks 21 hand landmarks seamlessly with zero computer lag.",
      author: "Hoàng Minh Tuấn",
      age: "22 tuổi",
      location: "Hà Nội",
      roleVi: "Tình nguyện viên CLB Điếc",
      roleEn: "Deaf Community Volunteer",
    },
    {
      id: 3,
      quoteVi:
        "Giao diện web máy tính chữ to, hình ảnh người thật thao tác rất chậm rãi, rõ ràng, không rối rắm như app điện thoại. Mỗi ngày tôi dành 10 phút học các từ quen thuộc như 'uống nước', 'uống thuốc', 'nghỉ ngơi' để trò chuyện cùng người nhà.",
      quoteEn:
        "The desktop web interface has clear large text and authentic educators demonstrating signs patiently and distinctly. Every day I spend 10 minutes learning essential daily words like 'drink water', 'take medicine', 'rest' to chat with my loved ones.",
      author: "Lê Hoàng",
      age: "58 tuổi",
      location: "TP. Hồ Chí Minh",
      roleVi: "Có người thân giảm thính lực",
      roleEn: "Family member with hearing loss",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 9000);
    return () => clearInterval(interval);
  }, []);

  const active = testimonials[currentSlide];

  return (
    <section className="py-16 sm:py-24 bg-[#F4EFE6]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal direction="up">
          {/* Trust & Proof Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 pb-10 border-b border-[#E2DBD0]">
            {/* Stars & Rating */}
            <div className="flex items-center gap-2.5">
              <div className="flex text-[#F59E0B] text-base">
                {"★".repeat(5)}
              </div>
              <div className="text-sm font-bold text-[#0F172A]">
                <span>4.9/5</span>
                <span className="text-[#64748B] font-normal ml-1">
                  {lang === "vi" ? "Đánh giá chất lượng" : "Quality Rating"}
                </span>
              </div>
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-[#E2DBD0]" />

            {/* Practice Count */}
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <span className="p-1.5 rounded-lg bg-[#e6f7f8] text-[#0d9fa5] border border-[#b2e7e9]">
                <IconWebcam className="w-4 h-4" />
              </span>
              <span>
                24.700+{" "}
                <span className="text-[#64748B] font-normal">
                  {lang === "vi" ? "Lượt thực hành webcam" : "Webcam sessions"}
                </span>
              </span>
            </div>

            <div className="hidden sm:block h-5 w-[1px] bg-[#E2DBD0]" />

            {/* Confidence Score & Avatar Stack */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <InitialsAvatar name="Nguyễn Mai" size="sm" className="ring-2 ring-white" />
                <InitialsAvatar name="Minh Tuấn" size="sm" className="ring-2 ring-white" />
                <InitialsAvatar name="Lê Hoàng" size="sm" className="ring-2 ring-white" />
              </div>
              <div className="text-sm font-bold text-[#0F172A]">
                <span>94.4%</span>
                <span className="text-[#64748B] font-normal ml-1">
                  {lang === "vi" ? "Tự tin giao tiếp" : "Signing Confidence"}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Testimonial Quote Card */}
        <ScrollReveal direction="up" delayMs={150}>
          <div className="pt-12 text-center relative">
            <div className="text-6xl text-[#94A3B8] select-none font-serif leading-none mb-4">
              “
            </div>

            {/* Slider Row with Desktop Arrow Buttons */}
            <div className="flex items-center justify-between gap-4">
              {/* Prev Button */}
              <button
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="hidden sm:flex w-12 h-12 rounded-full border border-[#E2DBD0] bg-white items-center justify-center text-[#0F172A] hover:bg-[#EDE6DA] shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Testimonial Content */}
              <div className="flex-1 px-4 sm:px-8 min-h-[160px] flex flex-col justify-center">
                <blockquote className="text-lg sm:text-xl font-medium text-[#0F172A] leading-relaxed transition-opacity duration-300">
                  &quot;{lang === "vi" ? active.quoteVi : active.quoteEn}&quot;
                </blockquote>

                <div className="mt-6 flex items-center justify-center gap-3.5">
                  <InitialsAvatar name={active.author} size="md" />
                  <div className="text-left">
                    <p className="text-base font-bold text-[#0F172A] leading-tight">
                      {active.author}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {active.age} · {active.location}
                    </p>
                    <p className="text-xs font-semibold text-[#08757a] mt-0.5">
                      {lang === "vi" ? active.roleVi : active.roleEn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="hidden sm:flex w-12 h-12 rounded-full border border-[#E2DBD0] bg-white items-center justify-center text-[#0F172A] hover:bg-[#EDE6DA] shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mobile Arrow Buttons & Dot Indicators */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={prevSlide}
                aria-label="Previous testimonial"
                className="sm:hidden w-10 h-10 rounded-full border border-[#E2DBD0] bg-white flex items-center justify-center text-[#0F172A]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === i ? "w-8 bg-[#0d9fa5]" : "w-2 bg-[#CDC5B8] hover:bg-[#A8A29E]"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                aria-label="Next testimonial"
                className="sm:hidden w-10 h-10 rounded-full border border-[#E2DBD0] bg-white flex items-center justify-center text-[#0F172A]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
