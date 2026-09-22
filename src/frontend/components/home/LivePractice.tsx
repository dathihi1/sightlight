import { ScrollReveal } from "@/components/ScrollReveal";
import { IconUsers, IconTarget } from "@/components/ui/Icons";

interface LivePracticeProps {
  lang: "en" | "vi";
}

export function LivePractice({ lang }: LivePracticeProps) {
  return (
    <section className="py-16 sm:py-24 bg-[#F4EFE6]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Headline */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <ScrollReveal direction="up">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-3 border border-[#b2e7e9]">
              {lang === "vi" ? "Giao Lưu & Thực Hành" : "Community Practice"}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A]">
              {lang === "vi"
                ? "Kết Nối Trực Tuyến & Giao Lưu Thực Tế Cùng Người Điếc Bản Ngữ"
                : "Connect Online & Engage with Native Deaf Signers"}
            </h2>
            <p className="mt-3 text-lg text-[#475569] leading-relaxed">
              {lang === "vi"
                ? "Tự luyện trước webcam là bước khởi đầu vững chắc, giao lưu thực tế là cầu nối gắn kết trái tim."
                : "Self-practice before the webcam builds a solid foundation; real-life connection bridges human hearts."}
            </p>
          </ScrollReveal>
        </div>

        {/* Content Box */}
        <ScrollReveal direction="up" delayMs={150}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white rounded-3xl p-8 sm:p-12 border border-[#E2DBD0] shadow-sm">
            {/* Visual: 2 Desktop Event Cards */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Online Group Practice Card */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2DBD0] p-5 shadow-xs flex items-start gap-4 transition-all hover:border-[#0d9fa5]">
                <div className="w-12 h-12 rounded-xl bg-[#e6f7f8] border border-[#b2e7e9] flex items-center justify-center text-[#0d9fa5] shrink-0">
                  <IconUsers className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === "vi" ? "Định kỳ hàng tuần" : "Weekly Schedule"}
                    </span>
                    <span className="text-[11px] text-[#64748B]">Google Meet</span>
                  </div>
                  <h4 className="text-base font-bold text-[#0F172A]">
                    {lang === "vi" ? "Phòng Luyện Đàm Thoại Trực Tuyến" : "Online Dialogue Practice Room"}
                  </h4>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    {lang === "vi"
                      ? "Phòng giao lưu nhóm 4–6 học viên cùng gia sư Điếc bản ngữ. Thực hành phản xạ hội thoại theo chủ đề đã học trên web."
                      : "Small groups of 4-6 learners guided by native Deaf tutors, practicing conversational flow on web-learned topics."}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#64748B]">
                    <span>{lang === "vi" ? "Tối Thứ 4 & Thứ 7 · 20:00" : "Wed & Sat · 8:00 PM"}</span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="font-semibold text-[#0d9fa5]">
                      {lang === "vi" ? "Miễn phí thành viên" : "Free for members"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offline Workshop Card */}
              <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2DBD0] p-5 shadow-xs flex items-start gap-4 transition-all hover:border-[#0d9fa5]">
                <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] shrink-0">
                  <IconTarget className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-700 border border-amber-200">
                      {lang === "vi" ? "Sự kiện trực tiếp" : "Offline Meetup"}
                    </span>
                    <span className="text-[11px] text-[#64748B]">Hà Nội · Đà Nẵng · TP.HCM</span>
                  </div>
                  <h4 className="text-base font-bold text-[#0F172A]">
                    {lang === "vi" ? "Workshop Văn Hóa Điếc & Giao Lưu Ngoại Tuyến" : "Deaf Culture & Offline Workshops"}
                  </h4>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    {lang === "vi"
                      ? "Không gian gặp gỡ thực tế phối hợp cùng Hội Người Điếc địa phương để chia sẻ câu chuyện văn hóa và thắt chặt tình bạn."
                      : "In-person cultural sharing organized with local Deaf associations to foster authentic friendships and cultural empathy."}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#64748B]">
                    <span>{lang === "vi" ? "Chủ nhật cuối tháng" : "Last Sunday of month"}</span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="font-semibold text-amber-700">
                      {lang === "vi" ? "Đăng ký tham gia" : "RSVP Required"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text & CTAs */}
            <div className="lg:col-span-6 space-y-6">
              {/* Block 1 */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#e6f7f8] text-[#0d9fa5] border border-[#b2e7e9] flex items-center justify-center">
                    <IconUsers className="w-5 h-5" />
                  </span>
                  <span>
                    {lang === "vi"
                      ? "Buổi Luyện Tập Nhóm Trực Tuyến"
                      : "Online Group Practice"}
                  </span>
                </h3>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  {lang === "vi"
                    ? "Tham gia các phòng luyện đàm thoại trực tuyến định kỳ do người Điếc bản ngữ điều phối. Rèn luyện sự nhịp nhàng và xóa bỏ rụt rè ban đầu khi giao tiếp."
                    : "Join scheduled online dialogue rooms facilitated by native Deaf tutors. Refine conversational rhythm and eliminate hesitation in a warm environment."}
                </p>
              </div>

              {/* Block 2 */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex items-center justify-center">
                    <IconTarget className="w-5 h-5" />
                  </span>
                  <span>
                    {lang === "vi"
                      ? "Workshop Văn Hóa Điếc Ngoại Tuyến"
                      : "Offline Inclusive Workshops"}
                  </span>
                </h3>
                <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                  {lang === "vi"
                    ? "Trải nghiệm thực tế các buổi giao lưu văn hóa do SignLight phối hợp tổ chức cùng Hội Người Điếc địa phương tại Hà Nội, Đà Nẵng và TP.HCM."
                    : "Engage in hands-on cultural workshops hosted in partnership with local Deaf associations across Hanoi, Da Nang, and Ho Chi Minh City."}
                </p>
              </div>

              {/* CTA in Teal */}
              <div className="pt-2">
                <button
                  onClick={() =>
                    alert(
                      lang === "vi"
                        ? "Lịch mở phòng luyện tập cộng đồng sẽ được gửi qua email sau khi đăng ký tài khoản!"
                        : "Community practice schedule will be notified via email upon sign-up!"
                    )
                  }
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full text-sm font-bold text-white bg-[#0d9fa5] hover:bg-[#0a8287] shadow-[0_4px_14px_rgba(13,159,165,0.3)] transition-all hover:scale-102 cursor-pointer"
                >
                  {lang === "vi" ? "Xem Lịch Hoạt Động Cộng Đồng" : "Check Event Schedule"}
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
