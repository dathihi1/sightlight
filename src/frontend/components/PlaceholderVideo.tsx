/**
 * Khối thay thế cho video mẫu chưa có.
 *
 * Bộ seed chỉ có khoá video placeholder (SEED-6) nên trình phát thật sẽ hỏng. Hiện khối này để người
 * xem demo hiểu ngay đây là nội dung mẫu, thay vì thấy một ô đen tưởng là lỗi.
 */
export function PlaceholderVideo({ label }: { label: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl bg-ink-900 text-center p-6 border border-ink-800">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brand-500">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <p className="px-4 text-sm text-white">{label}</p>
      <p className="px-4 text-xs text-ink-500">Video mẫu sẽ được bổ sung cùng giáo trình chuẩn</p>
    </div>
  );
}
