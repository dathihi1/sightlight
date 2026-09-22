import { ScrollReveal } from "@/components/ScrollReveal";
import { IconBook, IconWebcam, IconUsers, IconClock } from "@/components/ui/Icons";

interface StatsBarProps {
  lang: "en" | "vi";
}

export function StatsBar({ lang }: StatsBarProps) {
  const stats = [
    {
      value: "400",
      labelVi: "Ký Hiệu Chuẩn Hóa",
      labelEn: "Standardized Signs",
      descVi: "12 Chủ đề học tập thiết thực, đối chiếu Thông tư 17/2020/TT-BGDĐT",
      descEn: "12 Real-life units aligned with MoET standards",
      Icon: IconBook,
    },
    {
      value: "24.700+",
      labelVi: "Video Mẫu Full HD",
      labelEn: "Full HD Video Clips",
      descVi: "Cơ sở dữ liệu 1080p sắc nét, bao quát đa góc nhìn và biểu cảm tự nhiên",
      descEn: "1080p video library capturing diverse angles and facial expressions",
      Icon: IconWebcam,
    },
    {
      value: "24",
      labelVi: "Giảng Viên Điếc Bản Ngữ",
      labelEn: "Native Deaf Signers",
      descVi: "Giúp người học làm quen với các biến thể thực tế và văn hóa giao tiếp đời thực",
      descEn: "Exposing learners to natural signing variations in real life",
      Icon: IconUsers,
    },
    {
      value: "< 35ms",
      labelVi: "Độ Trễ Chấm Điểm AI",
      labelEn: "In-Browser Latency",
      descVi: "Xử lý trực tiếp trên CPU/GPU máy tính, không giật lag, bảo mật dữ liệu",
      descEn: "On-device inference running smoothly with complete camera privacy",
      Icon: IconClock,
    },
  ];

  return (
    <section className="py-8 sm:py-12 bg-[#F4EFE6]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, idx) => {
            const IconComponent = item.Icon;
            return (
              <ScrollReveal key={item.labelEn} direction="up" delayMs={idx * 100}>
                <div className="bg-white rounded-3xl p-6 border border-[#E2DBD0] shadow-xs flex flex-col items-start transition-all hover:shadow-md hover:border-[#0d9fa5] hover:-translate-y-0.5 h-full">
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                      {item.value}
                    </span>
                    <span className="p-2.5 rounded-2xl bg-[#F4EFE6] border border-[#E2DBD0] text-[#0d9fa5] shadow-2xs">
                      <IconComponent className="w-5 h-5" />
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    {lang === "vi" ? item.labelVi : item.labelEn}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                    {lang === "vi" ? item.descVi : item.descEn}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
