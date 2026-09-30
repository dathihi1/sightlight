/**
 * Hiển thị lỗi từ API.
 *
 * Nguyên tắc 3 của design.md: không bao giờ chỉ dùng màu để báo trạng thái — luôn kèm biểu tượng và
 * chữ (NFR-14).
 */
export function ErrorNotice({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-base font-bold text-danger-700"
    >
      <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-danger-500 text-sm font-bold text-white">
        !
      </span>
      <span>{message}</span>
    </p>
  );
}
