"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall } from "@/lib/api";

interface MeResult {
  preferences: { activeCourseId: string | null };
  profile: { displayName: string };
}

interface LearningPath {
  courseId: string;
  courseName: string;
  nextLessonId: string | null;
  units: UnitNode[];
}

interface UnitNode {
  id: string;
  title: string;
  isFree: boolean;
  chapters: ChapterNode[];
}

interface ChapterNode {
  id: string;
  title: string;
  lessons: LessonNode[];
}

interface LessonNode {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  locked: boolean;
  premiumLocked: boolean;
  // Backend cấu hình Jackson bỏ hẳn field null, nên field vắng mặt về tới đây là `undefined`.
  bestScorePercent?: number | null;
}

/** SCR-08 — lộ trình học (FR-09). */
export default function LearningPathPage() {
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => apiCall<MeResult>("/api/v1/me"),
  });

  const courseId = me.data?.preferences.activeCourseId ?? null;

  const path = useQuery({
    queryKey: ["path", courseId],
    enabled: Boolean(courseId),
    queryFn: () => apiCall<LearningPath>(`/api/v1/courses/${courseId}/path`),
  });

  if (me.isError) {
    const message =
      me.error instanceof ApiError && me.error.httpStatus === 401
        ? "Bạn cần đăng nhập để xem lộ trình học."
        : "Không tải được thông tin tài khoản.";
    return (
      <div className="space-y-4">
        <ErrorNotice message={message} />
        <Link href="/dang-nhap" className="text-[var(--color-brand-600)] underline">
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (me.isLoading || path.isLoading) {
    return <p className="text-[var(--color-ink-600)]">Đang tải lộ trình…</p>;
  }

  if (path.isError || !path.data) {
    return <ErrorNotice message="Không tải được lộ trình học." />;
  }

  const data = path.data;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{data.courseName}</h1>
        {data.nextLessonId && (
          <Link
            href={`/hoc/bai/${data.nextLessonId}`}
            className="inline-flex rounded-lg bg-[var(--color-brand-600)] px-5 py-3 font-medium text-white hover:bg-[var(--color-brand-700)]"
          >
            Tiếp tục học
          </Link>
        )}
      </header>

      {data.units.map((unit) => (
        <section key={unit.id} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{unit.title}</h2>
            {unit.isFree ? (
              <span className="rounded-full bg-[var(--color-success-050)] px-2 py-0.5 text-xs text-[var(--color-success-700)]">
                Miễn phí
              </span>
            ) : (
              <span className="rounded-full bg-[var(--color-brand-050)] px-2 py-0.5 text-xs text-[var(--color-brand-600)]">
                Premium
              </span>
            )}
          </div>

          {unit.chapters.map((chapter) => (
            <div key={chapter.id} className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--color-ink-600)]">{chapter.title}</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <LessonRow lesson={lesson} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LessonNode }) {
  // Hai loại khoá cần hai thông điệp khác nhau (BR-A12 vs BR-A14) — gộp lại là người học hiểu sai.
  const blocked = lesson.locked || lesson.premiumLocked;
  const reason = lesson.premiumLocked
    ? "Cần gói Premium"
    : lesson.locked
      ? "Hoàn thành bài trước để mở"
      : null;

  const statusLabel =
    lesson.status === "COMPLETED"
      ? "Đã hoàn thành"
      : lesson.status === "IN_PROGRESS"
        ? "Đang học"
        : "Chưa học";

  const content = (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
        blocked
          ? "border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
          : "border-[var(--color-border-default)] hover:border-[var(--color-brand-600)]"
      }`}
    >
      <div>
        <p className="font-medium">{lesson.title}</p>
        <p className="text-xs text-[var(--color-ink-600)]">
          {/* Biểu tượng + chữ, không chỉ dựa vào màu (nguyên tắc 3 của design.md). */}
          {lesson.status === "COMPLETED" && <span aria-hidden="true">✓ </span>}
          {reason ?? statusLabel}
          {lesson.bestScorePercent != null && ` · ${lesson.bestScorePercent}%`}
        </p>
      </div>
      {blocked && <span aria-hidden="true">🔒</span>}
    </div>
  );

  if (blocked) {
    return (
      <div aria-disabled="true" className="cursor-not-allowed">
        {content}
      </div>
    );
  }
  return <Link href={`/hoc/bai/${lesson.id}`}>{content}</Link>;
}
