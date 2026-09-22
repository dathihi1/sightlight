import { ScrollReveal } from "@/components/ScrollReveal";
import { IconLightning, IconChart, IconBuilding } from "@/components/ui/Icons";

interface BusinessSectionProps {
  lang: "en" | "vi";
}

export function BusinessSection({ lang }: BusinessSectionProps) {
  const pillars = [
    {
      titleVi: "Triển khai tức thì trên Web",
      titleEn: "Instant Web-Based Deployment",
      descVi: "Nhân sự mở link trình duyệt nội bộ là có thể tham gia đào tạo theo 12 Unit chuẩn hóa mà không cần IT can thiệp cài đặt.",
      descEn: "Staff open an internal browser link to access 12 standardized training units with zero IT installation overhead.",
      Icon: IconLightning,
    },
    {
      titleVi: "Cổng Quản Lý LMS Doanh Nghiệp",
      titleEn: "Enterprise LMS Management Portal",
      descVi: "Giúp bộ phận đào tạo theo dõi tiến độ học tập, điểm số thực hành AI và cấp chứng nhận hoàn thành cho từng nhân viên.",
      descEn: "Helps HR & L&D teams monitor completion rates, AI gesture practice scores, and issue certifications.",
      Icon: IconChart,
    },
    {
      titleVi: "Mô-đun Chuyên Ngành Tùy Biến",
      titleEn: "Customized Industry Modules",
      descVi: "Cung cấp các gói ký hiệu chuyên sâu phục vụ Y tế, F&B, Khách sạn, Quầy vé và Giao dịch ngân hàng theo nhu cầu thực tế.",
      descEn: "Tailored vocabulary packs for Healthcare, Hospitality, Food & Beverage, and Front-desk Banking transactions.",
      Icon: IconBuilding,
    },
  ];

  return (
    <section id="businesses" className="py-16 sm:py-24 bg-[#EDE6DA] border-t border-[#E2DBD0]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Headline */}
        <ScrollReveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#e6f7f8] text-[#08757a] text-xs font-bold uppercase tracking-wider mb-3 border border-[#b2e7e9]">
              {lang === "vi" ? "Dành Cho Trường Học & Doanh Nghiệp" : "For Schools & Organizations"}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A]">
              {lang === "vi"
                ? "Đào Tạo VSL Chuẩn Hóa Trên Hệ Thống Máy Tính Tổ Chức"
                : "Standardized VSL Training for Schools & Enterprise Desktops"}
            </h2>
            <p className="mt-3 text-lg text-[#475569] leading-relaxed">
              {lang === "vi"
                ? "Triển khai dễ dàng trên phòng máy trường học, máy tính bệnh viện, quầy giao dịch ngân hàng và doanh nghiệp dịch vụ nhằm đáp ứng tiêu chuẩn Đa dạng - Bình đẳng - Hòa nhập (DEI) và mục tiêu ESG."
                : "Deploy effortlessly across school computer labs, hospital terminals, bank counters, and service enterprises meeting DEI and ESG standards."}
            </p>
          </div>
        </ScrollReveal>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: 3 Pillars & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              {pillars.map((p, index) => {
                const IconComponent = p.Icon;
                return (
                  <ScrollReveal key={p.titleEn} direction="up" delayMs={index * 120}>
                    <div className="bg-white rounded-2xl p-5 border border-[#E2DBD0] shadow-2xs flex items-start gap-4 transition-all hover:border-[#0d9fa5]">
                      <span className="p-3 rounded-xl bg-[#F4EFE6] border border-[#E2DBD0] text-[#0d9fa5] shadow-2xs shrink-0 flex items-center justify-center">
                        <IconComponent className="w-6 h-6" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-[#0F172A]">
                          {lang === "vi" ? p.titleVi : p.titleEn}
                        </h3>
                        <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                          {lang === "vi" ? p.descVi : p.descEn}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            <ScrollReveal direction="up" delayMs={360}>
              <div className="pt-2">
                <button
                  onClick={() =>
                    alert(
                      lang === "vi"
                        ? "Liên hệ đối tác đào tạo VSL tổ chức: contact@signlight.vn"
                        : "Contact enterprise team: contact@signlight.vn"
                    )
                  }
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-bold text-white bg-[#0F172A] hover:bg-[#1E293B] shadow-md transition-all hover:scale-102 cursor-pointer"
                >
                  {lang === "vi"
                    ? "Nhận Tư Vấn Giải Pháp & Báo Giá Doanh Nghiệp"
                    : "Request an Enterprise Quote"}
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Visual Collaboration Box */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal direction="up" delayMs={180} className="w-full max-w-md">
              <div className="relative w-full">
                <div className="bg-linear-to-br from-[#e6f7f8] to-[#ccfbf1]/80 rounded-3xl p-8 border border-[#b2e7e9] shadow-lg text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-[#0d9fa5] border border-[#b2e7e9]">
                    <IconBuilding className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-[#0F172A]">
                    {lang === "vi"
                      ? "Đối tác giáo dục & Doanh nghiệp"
                      : "Educational & Enterprise Partners"}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {lang === "vi"
                      ? "Được tin dùng trong các chương trình đào tạo kỹ năng hoà nhập cho nhân viên chăm sóc khách hàng, nhân viên y tế và giáo viên trên khắp Việt Nam."
                      : "Trusted by healthcare workers, customer support teams, and inclusive education programs across Vietnam."}
                  </p>

                  <div className="pt-4 grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-white">
                      <span className="text-lg font-extrabold text-[#0d9fa5] block">96%</span>
                      <span className="text-[11px] text-[#64748B]">
                        {lang === "vi"
                          ? "Nhân sự tự tin xử lý tình huống đón tiếp khách Điếc cơ bản"
                          : "Staff confident in welcoming Deaf visitors"}
                      </span>
                    </div>
                    <div className="bg-white/95 backdrop-blur-xs rounded-xl p-3 border border-white">
                      <span className="text-lg font-extrabold text-[#08757a] block">0 Đồng</span>
                      <span className="text-[11px] text-[#64748B]">
                        {lang === "vi"
                          ? "Chi phí đầu tư thêm thiết bị hay máy chủ chuyên dụng"
                          : "Extra hardware or dedicated server expense"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
