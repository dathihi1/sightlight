import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | SignLight",
  description: "Điều khoản sử dụng nền tảng học Ngôn ngữ Ký hiệu Việt Nam SignLight.",
};

const sections = [
  {
    title: "1. Phạm vi áp dụng",
    content:
      "Điều khoản này áp dụng khi bạn tạo tài khoản, truy cập hoặc sử dụng các bài học, công cụ luyện tập và dịch vụ liên quan của SignLight. Khi tiếp tục sử dụng, bạn xác nhận đã đọc và đồng ý với các điều khoản này.",
  },
  {
    title: "2. Tài khoản của bạn",
    content:
      "Bạn cung cấp thông tin chính xác, bảo mật thông tin đăng nhập và chịu trách nhiệm với hoạt động diễn ra trên tài khoản của mình. Không chia sẻ, mua bán hoặc sử dụng tài khoản của người khác khi chưa được phép.",
  },
  {
    title: "3. Sử dụng dịch vụ đúng mục đích",
    content:
      "SignLight là nền tảng hỗ trợ học Ngôn ngữ Ký hiệu Việt Nam. Bạn không được can thiệp vào hệ thống, sao chép trái phép nội dung, phát tán mã độc hoặc sử dụng dịch vụ theo cách gây ảnh hưởng đến người dùng và cộng đồng.",
  },
  {
    title: "4. Nội dung và kết quả luyện tập",
    content:
      "Bài học, từ điển và kết quả nhận diện cử chỉ được cung cấp để hỗ trợ việc học. Kết quả từ công cụ AI mang tính tham khảo, không thay thế cho giáo viên, người phiên dịch hoặc đánh giá chuyên môn.",
  },
  {
    title: "5. Quyền sở hữu nội dung",
    content:
      "Nội dung, thiết kế, thương hiệu và phần mềm trên SignLight được bảo vệ theo quy định hiện hành. Bạn chỉ được sử dụng chúng cho mục đích học tập cá nhân, trừ khi có sự đồng ý bằng văn bản từ SignLight.",
  },
  {
    title: "6. Thay đổi dịch vụ và điều khoản",
    content:
      "Chúng tôi có thể cập nhật dịch vụ hoặc điều khoản để cải thiện trải nghiệm và đáp ứng yêu cầu vận hành. Phiên bản mới nhất sẽ được công bố tại trang này; việc tiếp tục sử dụng sau khi cập nhật đồng nghĩa với việc bạn chấp nhận phiên bản đó.",
  },
];

export default function TermsOfServicePage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/dang-ky" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Quay lại đăng ký
      </Link>
      <article className="mt-5 rounded-3xl border border-ink-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">SignLight</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Điều khoản sử dụng</h1>
        <p className="mt-3 text-sm text-ink-600">Cập nhật lần cuối: 03/10/2026</p>
        <p className="mt-8 text-base leading-7 text-ink-700">
          Chào mừng bạn đến với SignLight. Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng nền tảng.
        </p>
        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-ink-900">{section.title}</h2>
              <p className="mt-2 leading-7 text-ink-700">{section.content}</p>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}
