import Link from "next/link";

/**
 * Trang chủ (SCR-01). Render tĩnh để đạt LCP < 2,5 giây và phục vụ SEO (NFR-02, BR-A85).
 */
export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <p className="inline-block rounded-full bg-[var(--color-brand-050)] px-3 py-1 text-xs font-medium text-[var(--color-brand-600)]">
          Ngôn ngữ Ký hiệu Việt Nam · VSL
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Học ký hiệu và biết ngay mình làm đúng hay sai
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-ink-600)]">
          Xem video mẫu, tự thực hiện trước camera, và nhận phản hồi kèm gợi ý sửa cụ thể. Không có ai
          sửa sai là trở ngại lớn nhất của người tự học — đó là thứ SignLight giải quyết.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dang-ky"
            className="inline-flex items-center rounded-lg bg-[var(--color-brand-600)] px-6 py-3 font-medium text-white hover:bg-[var(--color-brand-700)]"
          >
            Bắt đầu học miễn phí
          </Link>
          <Link
            href="/luyen-ai"
            className="inline-flex items-center rounded-lg border border-[var(--color-border-strong)] px-6 py-3 font-medium"
          >
            Thử luyện với AI
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="Lộ trình có thứ tự"
          body="Unit → Chương → Bài học, mở khoá dần theo tiến độ. Bài đã học không bao giờ bị khoá lại."
        />
        <FeatureCard
          title="AI chấm ký hiệu động"
          body="Thực hiện trọn một ký hiệu trước camera, hệ thống nhận diện và nói rõ nhận được ký hiệu nào."
        />
        <FeatureCard
          title="Hình ảnh không rời máy bạn"
          body="Trình duyệt tự trích đặc trưng chuyển động. Thứ duy nhất gửi lên máy chủ là dãy số — không có khung hình nào."
        />
      </section>

      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-6">
        <h2 className="text-xl font-semibold">Nội dung hiện tại là bộ dữ liệu mẫu</h2>
        <p className="mt-2 text-[var(--color-ink-600)]">
          Bản đang chạy dùng bộ 30 ký hiệu của mô hình MVP-30 làm dữ liệu dựng và nghiệm thu chức năng.
          Giáo trình chính thức sẽ được biên soạn ở bước riêng.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-[var(--color-border-default)] p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--color-ink-600)]">{body}</p>
    </article>
  );
}
