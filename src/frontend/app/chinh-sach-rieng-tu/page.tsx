import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách riêng tư | SignLight",
  description: "Chính sách riêng tư và cách SignLight xử lý dữ liệu người dùng.",
};

const sections = [
  {
    title: "1. Dữ liệu chúng tôi thu thập",
    content:
      "Khi bạn tạo và sử dụng tài khoản, SignLight có thể xử lý tên hiển thị, email, thông tin đăng nhập đã được bảo vệ, tiến độ học, mục tiêu luyện tập và thông tin kỹ thuật cần thiết để vận hành dịch vụ.",
  },
  {
    title: "2. Mục đích sử dụng dữ liệu",
    content:
      "Dữ liệu được dùng để tạo và bảo vệ tài khoản, cá nhân hóa lộ trình học, lưu tiến độ, cung cấp hỗ trợ kỹ thuật và cải thiện độ ổn định của SignLight. Chúng tôi không bán dữ liệu cá nhân của bạn.",
  },
  {
    title: "3. Luyện tập bằng camera",
    content:
      "Khi bạn chủ động bật tính năng luyện cử chỉ, ứng dụng sẽ cần quyền truy cập camera để thực hiện chức năng đó. Bạn có thể tắt quyền camera bất cứ lúc nào trong trình duyệt hoặc thiết bị của mình.",
  },
  {
    title: "4. Chia sẻ và bảo vệ dữ liệu",
    content:
      "Chúng tôi chỉ chia sẻ dữ liệu khi cần để vận hành dịch vụ, tuân thủ yêu cầu pháp luật hoặc bảo vệ an toàn cho người dùng và hệ thống. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu, tuy nhiên không có phương thức truyền tải nào an toàn tuyệt đối.",
  },
  {
    title: "5. Lựa chọn của bạn",
    content:
      "Bạn có thể cập nhật thông tin hồ sơ, yêu cầu hỗ trợ về tài khoản hoặc ngừng sử dụng dịch vụ. Khi không còn muốn sử dụng SignLight, bạn có thể liên hệ kênh hỗ trợ của SignLight để được hướng dẫn xử lý tài khoản theo quy định áp dụng.",
  },
  {
    title: "6. Cập nhật chính sách",
    content:
      "Chính sách này có thể được cập nhật khi dịch vụ hoặc yêu cầu pháp lý thay đổi. Chúng tôi sẽ công bố bản mới nhất trên trang này và khuyến nghị bạn xem lại định kỳ.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/dang-ky" className="text-sm font-semibold text-brand-700 hover:underline">
        ← Quay lại đăng ký
      </Link>
      <article className="mt-5 rounded-3xl border border-ink-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">SignLight</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Chính sách riêng tư</h1>
        <p className="mt-3 text-sm text-ink-600">Cập nhật lần cuối: 03/10/2026</p>
        <p className="mt-8 text-base leading-7 text-ink-700">
          SignLight tôn trọng quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi xử lý dữ liệu khi bạn sử dụng nền tảng.
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
