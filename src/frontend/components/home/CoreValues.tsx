import { ScrollReveal } from "@/components/ScrollReveal";

interface CoreValuesProps {
  lang: "en" | "vi";
}

export function CoreValues({ lang }: CoreValuesProps) {
  const values = [
    {
      num: "01",
      pillarVi: "Đồng cảm",
      pillarEn: "Empathy",
      titleVi: "Lắng nghe những thanh âm không cất thành lời",
      titleEn: "Listening to Sounds Unspoken",
      descVi:
        "Đã bao giờ bạn nhìn thấy người thân khiếm thính chỉ biết cười gượng gạo trong bữa cơm gia đình, rồi lẳng lặng rời bàn ăn vì không thể theo kịp câu chuyện của mọi người? Hơn 2,5 triệu người Điếc tại Việt Nam không hề cô độc nếu chúng ta biết lắng nghe bằng ánh mắt. Bắt đầu từ sự đồng cảm sâu sắc, SignLight giúp bạn chủ động bước một bước về phía họ — để không còn ai cảm thấy mình là người xa lạ ngay dưới mái ấm của chính mình.",
      descEn:
        "Have you ever seen a deaf loved one smile awkwardly at the family dinner table, then quietly walk away because they couldn't follow the conversation? Over 2.5 million Deaf individuals in Vietnam are never alone when we learn to listen with our eyes. Grounded in profound empathy, SignLight empowers you to take a step toward them — so no one feels like a stranger under their own roof.",
      icon: (
        <svg className="w-6 h-6 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Eye & gentle listening wave */}
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      num: "02",
      pillarVi: "Ân cần",
      pillarEn: "Kindness",
      titleVi: "Người bạn đồng hành kiên nhẫn và bao dung",
      titleEn: "A Patient and Gentle Companion",
      descVi:
        "Tự học ký hiệu một mình rất dễ nản lòng vì nỗi sợ làm sai mà chẳng có ai sửa giúp. Chiếc máy tính trước mặt bạn giờ đây trở thành một người bạn đồng hành ân cần, lặng thầm và kiên nhẫn. Bạn có thể thoải mái soi mình, tập đi tập lại từng cử động ngón tay trong góc nhỏ bình yên của riêng mình mà không sợ bị phán xét hay gièm pha. Mọi khoảnh khắc luyện tập đều được nâng niu và bảo bọc trọn vẹn trong sự riêng tư tuyệt đối.",
      descEn:
        "Teaching yourself signs alone can be daunting when there is no one to guide or correct you. The computer screen before you now becomes a gentle, silent, and patient companion. You can practice and refine each finger movement freely in your own peaceful corner without fear of judgment. Every practice moment is cherished in complete privacy.",
      icon: (
        <svg className="w-6 h-6 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Shield / sheltering protection */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      num: "03",
      pillarVi: "Nhiệt huyết",
      pillarEn: "Passion",
      titleVi: "Thắp sáng niềm vui kết nối mỗi ngày",
      titleEn: "Igniting the Joy of Daily Connection",
      descVi:
        "Mỗi 10 phút ngồi trước màn hình không đơn thuần là một buổi học, mà là một lời nhắn gửi yêu thương được chuẩn bị chu đáo. Niềm say mê và nhiệt huyết bền bỉ sẽ biến những ngượng ngùng, lúng túng ban đầu của đôi bàn tay thành ngôn ngữ tự nhiên của trái tim. Để rồi một ngày, bạn nhận ra rào cản vô hình bấy lâu đã tan biến lúc nào không hay.",
      descEn:
        "Every 10 minutes at the screen is more than a study session; it is a thoughtfully prepared message of love. Enduring passion transforms initial hesitation into the natural language of the heart. Until one day, you realize the invisible barrier has dissolved completely.",
      icon: (
        <svg className="w-6 h-6 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Radiant spark of passion */}
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      num: "04",
      pillarVi: "Tận tâm",
      pillarEn: "Dedication",
      titleVi: "Nâng niu từng nét ký hiệu từ chính người trong cuộc",
      titleEn: "Cherishing Every Sign from the Community",
      descVi:
        "Từng bài học trên SignLight không sao chép sách vở vô hồn, mà được chắt chiu từ chính đôi mắt, nụ cười và đôi bàn tay ấm áp của cộng đồng Người Điếc Việt Nam. Chúng tôi nắn nót chuẩn hóa từng cử chỉ theo đúng văn hóa và thói quen đời thường của 3 miền Bắc – Trung – Nam, tận tâm đồng hành để mỗi ký hiệu bạn trao đi đều trọn vẹn sự chân thành và lòng tôn trọng.",
      descEn:
        "Lessons on SignLight are never lifeless rote memorization; they are crafted from the eyes, smiles, and warm hands of the Vietnamese Deaf community. We meticulously standardize each gesture according to the living culture of the Northern, Central, and Southern regions, walking with you so that every sign you give is full of sincerity and respect.",
      icon: (
        <svg className="w-6 h-6 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Two hands joining / mutual support */}
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#F4EFE6] relative overflow-hidden border-t border-[#E2DBD0]">
      {/* Soft Decorative Ambient Background */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[#ccfbf1]/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-[#FEF3C7]/30 blur-3xl -z-10 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Block */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-5 border border-[#b2e7e9]">
              <span className="w-2 h-2 rounded-full bg-[#0d9fa5]" />
              <span>
                {lang === "vi"
                  ? "Giá Trị Cốt Lõi • Đồng Cảm Dẫn Lối, Nhiệt Huyết Trao Tay"
                  : "Core Values • Guided by Empathy, Driven by Passion"}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
              {lang === "vi" ? (
                <>
                  Đồng cảm dẫn lối, nhiệt huyết trao tay:{" "}
                  <span className="text-[#0d9fa5] block mt-1">
                    Hành trình thấu hiểu qua từng nét ký hiệu.
                  </span>
                </>
              ) : (
                <>
                  Empathy Leads the Way, Passion Connects Hands:{" "}
                  <span className="text-[#0d9fa5] block mt-1">
                    A Journey of Understanding Through Every Sign.
                  </span>
                </>
              )}
            </h2>

            <p className="mt-6 text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto font-normal">
              {lang === "vi"
                ? "Học Ngôn ngữ Ký hiệu không phải là ghi nhớ những động tác máy móc, mà là học cách mở rộng trái tim để bước vào thế giới yên lặng nhưng ngập tràn yêu thương của người mình thương quý."
                : "Learning Sign Language is not about memorizing mechanical motions, but opening your heart to enter the quiet yet love-filled world of those you cherish."}
            </p>
          </div>
        </ScrollReveal>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {values.map((v, idx) => (
            <ScrollReveal key={v.num} direction="up" delayMs={idx * 120}>
              <div className="bg-white rounded-3xl p-7 sm:p-9 border border-[#E2DBD0] shadow-sm hover:border-[#0d9fa5]/60 hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between group">
                <div>
                  {/* Top Bar: Icon + Pillar Tag + Numeric Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#e6f7f8] border border-[#b2e7e9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {v.icon}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#F4EFE6] text-[#08757a] text-xs font-extrabold border border-[#E2DBD0]">
                        {lang === "vi" ? v.pillarVi : v.pillarEn}
                      </span>
                    </div>
                    <span className="text-xl font-mono font-extrabold text-[#94A3B8]/60 group-hover:text-[#0d9fa5] transition-colors">
                      {v.num}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] leading-snug mb-3">
                    {lang === "vi" ? v.titleVi : v.titleEn}
                  </h3>

                  {/* Narrative Body */}
                  <p className="text-sm sm:text-[15px] text-[#475569] leading-relaxed font-normal">
                    {lang === "vi" ? v.descVi : v.descEn}
                  </p>
                </div>

                {/* Subtle Divider Line */}
                <div className="mt-6 pt-4 border-t border-[#E2DBD0]/60 flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold text-[#08757a]">
                    {lang === "vi" ? "SignLight vì Cộng đồng" : "SignLight for Community"}
                  </span>
                  <span className="font-mono text-[11px] text-[#94A3B8]">
                    VSL Standard
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
