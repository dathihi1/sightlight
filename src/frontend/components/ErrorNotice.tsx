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
      className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-050)] px-4 py-3 text-sm text-[var(--color-danger-700)]"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  );
}
