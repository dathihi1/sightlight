"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function AboutPage() {
  const { lang, t } = useLanguage();

  const values = [
    {
      titleVi: "1. Đồng cảm — Lắng nghe những thanh âm không cất thành lời",
      titleEn: "1. Empathy — Listening to Sounds Unspoken",
      descVi:
        "Bắt đầu từ việc nhìn thấy người thân khiếm thính lẳng lặng rời bữa cơm gia đình vì không thể theo kịp câu chuyện. Hơn 2,5 triệu người Điếc tại Việt Nam không hề cô độc nếu chúng ta biết lắng nghe bằng ánh mắt, mở lòng bước một bước về phía họ.",
      descEn:
        "Beginning with witnessing deaf loved ones quietly leaving the dinner table unable to follow the conversation. Over 2.5 million Deaf individuals in Vietnam are never alone when we listen with our eyes and step toward them.",
      iconKey: "empathy",
    },
    {
      titleVi: "2. Ân cần — Người bạn đồng hành kiên nhẫn và bao dung",
      titleEn: "2. Kindness — A Patient and Gentle Companion",
      descVi:
        "Chiếc máy tính trở thành người bạn đồng hành ân cần, lặng thầm và kiên nhẫn. Bạn có thể thoải mái soi mình, tập đi tập lại từng cử động ngón tay trong góc nhỏ bình yên mà không sợ phán xét, với sự riêng tư được bảo bọc 100% trên thiết bị.",
      descEn:
        "The computer becomes a patient, silent, and gentle companion. Practice freely in your peaceful space without fear of judgment, with complete on-device privacy safeguarding every moment.",
      iconKey: "kindness",
    },
    {
      titleVi: "3. Nhiệt huyết — Thắp sáng niềm vui kết nối mỗi ngày",
      titleEn: "3. Passion — Igniting the Joy of Daily Connection",
      descVi:
        "Mỗi 10 phút ngồi trước màn hình là một lời nhắn gửi yêu thương được chuẩn bị chu đáo. Niềm say mê và nhiệt huyết bền bỉ sẽ biến những vụng về ban đầu của đôi bàn tay thành ngôn ngữ tự nhiên của trái tim.",
      descEn:
        "Every 10 minutes at the screen is a lovingly prepared message. Enduring passion turns clumsy initial attempts into the natural, graceful language of the heart.",
      iconKey: "passion",
    },
    {
      titleVi: "4. Tận tâm — Nâng niu từng nét ký hiệu từ chính người trong cuộc",
      titleEn: "4. Dedication — Cherishing Every Sign from the Community",
      descVi:
        "Từng bài học được chắt chiu từ chính ánh mắt, nụ cười và bàn tay ấm áp của cộng đồng Người Điếc Việt Nam. Chúng tôi nắn nót chuẩn hóa từng cử chỉ theo đúng văn hóa đời thường của 3 miền Bắc – Trung – Nam, để mỗi ký hiệu trao đi đều trọn vẹn sự tôn trọng.",
      descEn:
        "Every lesson is crafted from the smiles and warm hands of the Vietnamese Deaf community across Northern, Central, and Southern regions, ensuring every sign you give is filled with genuine respect.",
      iconKey: "dedication",
    },
  ];

  const renderIcon = (key: string) => {
    switch (key) {
      case "empathy":
        return (
          <svg className="w-7 h-7 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case "kindness":
        return (
          <svg className="w-7 h-7 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      case "passion":
        return (
          <svg className="w-7 h-7 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case "dedication":
      default:
        return (
          <svg className="w-7 h-7 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full bg-[#F4EFE6] min-h-screen py-12 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb & Subtitle */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-4 border border-[#b2e7e9]">
              {t("Về SignLight • Sứ mệnh", "About SignLight • Mission")}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              {t(
                "Thắp sáng cầu nối giữa Người Nghe và Cộng đồng Người Điếc",
                "Illuminating the Bridge Between Hearing and Deaf Communities"
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed">
              {t(
                "SignLight ra đời với niềm tin rằng ngôn ngữ ký hiệu không phải là điều xa lạ — đó là ngôn ngữ của sự thấu hiểu, tôn trọng và bình đẳng.",
                "SignLight was born out of the conviction that sign language is not a barrier — it is the language of empathy, mutual respect, and inclusion."
              )}
            </p>
          </div>
        </ScrollReveal>

        {/* Story Section */}
        <ScrollReveal direction="up" delay={100}>
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DBD0] shadow-sm mb-16 space-y-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              {t("Câu chuyện của chúng tôi", "Our Story")}
            </h2>
            <div className="prose text-[#475569] text-sm sm:text-base leading-relaxed space-y-4">
              <p>
                {t(
                  "Tại Việt Nam, có hơn 2,5 triệu người khiếm thính và Điếc. Mặc dù vậy, tài liệu và ứng dụng học Ngôn ngữ Ký hiệu Việt Nam (VSL) tương tác trực tuyến còn rất hạn chế. Phần lớn người học gặp khó khăn vì video 2D tĩnh không thể phản hồi xem cử chỉ bàn tay đã đúng vị trí, góc độ và nhịp độ hay chưa.",
                  "In Vietnam, more than 2.5 million people are deaf or hard-of-hearing. Despite this, interactive digital resources for Vietnamese Sign Language (VSL) remain scarce. Most learners struggle because static video clips cannot verify whether hand shapes, orientation, and motion are executed accurately."
                )}
              </p>
              <p>
                {t(
                  "SignLight kết hợp giữa giáo án từ giáo viên Điếc bản ngữ và công nghệ AI nhận diện thị giác máy tính chạy trực tiếp trên trình duyệt. Người học được hướng dẫn từng cử chỉ chi tiết, bật webcam để AI chấm điểm độ chính xác ngay lập tức và tự tin giao tiếp chỉ sau vài tuần rèn luyện.",
                  "SignLight bridges this gap by combining pedagogical content crafted by native Deaf educators with real-time computer vision AI running client-side in the browser. Learners receive instant feedback on their gestures and gain practical signing fluency in just minutes a day."
                )}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* 4 Pillars Grid */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#08757a] bg-[#e6f7f8] px-3.5 py-1 rounded-full border border-[#b2e7e9] inline-block mb-2">
              {t("Đồng cảm dẫn lối • Nhiệt huyết trao tay", "Guided by Empathy • Driven by Passion")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              {t("Bốn giá trị cốt lõi chạm đến trái tim", "Four Core Values from the Heart")}
            </h2>
            <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
              {t(
                "Học Ngôn ngữ Ký hiệu là học cách mở rộng trái tim để bước vào thế giới yên lặng nhưng ngập tràn yêu thương của người mình thương quý.",
                "Learning Sign Language is opening your heart to enter the quiet yet love-filled world of those you cherish."
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, idx) => (
              <ScrollReveal key={v.titleEn} direction="up" delay={idx * 100}>
                <div className="bg-white rounded-2xl p-6 border border-[#E2DBD0] shadow-2xs hover:border-[#0d9fa5] hover:shadow-md transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2DBD0] inline-block mb-4">
                      {renderIcon(v.iconKey)}
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                      {lang === "vi" ? v.titleVi : v.titleEn}
                    </h3>
                    <p className="text-sm text-[#475569] leading-relaxed">
                      {lang === "vi" ? v.descVi : v.descEn}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <ScrollReveal direction="up">
          <div className="bg-gradient-to-r from-[#006194] to-[#0d9fa5] rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              {t("Cùng SignLight xây dựng xã hội hoà nhập", "Join SignLight in Building an Inclusive World")}
            </h2>
            <p className="text-white/90 text-sm sm:text-base max-w-xl mx-auto mb-8">
              {t(
                "Bắt đầu học ký hiệu VSL hôm nay — hoàn toàn miễn phí, trực quan và ý nghĩa.",
                "Start learning VSL signs today — free, interactive, and truly impactful."
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dang-ky"
                className="px-8 py-3.5 rounded-full bg-white text-[#006194] font-bold text-sm hover:bg-[#F4EFE6] shadow-md hover:scale-105 transition-all"
              >
                {t("Bắt đầu học miễn phí", "Start Learning Free")}
              </Link>
              <Link
                href="/tu-dien"
                className="px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm border border-white/40 transition-all"
              >
                {t("Khám phá từ điển VSL", "Explore VSL Dictionary")}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
