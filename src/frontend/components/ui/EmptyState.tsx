import { Mascot } from "./Mascot";

/** Trạng thái rỗng / chờ / cần đăng nhập: linh vật + tiêu đề + mô tả + hành động. */
export function EmptyState({
  title,
  body,
  mood = "happy",
  heading: Heading = "h1",
  children,
}: {
  title: string;
  body?: string;
  mood?: "happy" | "wow" | "sad";
  heading?: "h1" | "h2";
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <Mascot className="w-28" mood={mood} wave={mood === "happy"} />
      <Heading className="mt-6 text-2xl font-bold text-ink-900">{title}</Heading>
      {body && <p className="mt-2 text-base text-ink-600">{body}</p>}
      {children && <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{children}</div>}
    </div>
  );
}
