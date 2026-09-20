/**
 * Khối thay thế cho video mẫu chưa có.
 *
 * Bộ seed chỉ có khoá video placeholder (SEED-6) nên trình phát thật sẽ hỏng. Hiện khối này để người
 * xem demo hiểu ngay đây là nội dung mẫu, thay vì thấy một ô đen tưởng là lỗi.
 */
export function PlaceholderVideo({ label }: { label: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-[var(--color-bg-video)] text-center">
      <span aria-hidden="true" className="text-4xl">
        🎬
      </span>
      <p className="px-4 text-sm font-medium text-white">{label}</p>
      <p className="px-4 text-xs text-slate-400">Video mẫu sẽ được bổ sung cùng giáo trình thật</p>
    </div>
  );
}
