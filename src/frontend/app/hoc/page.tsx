"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { useAuthSession } from "@/lib/useAuthSession";
import { apiCall } from "@/lib/api";

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
  const { isClient, isLoggedIn, isLoading, user } = useAuthSession();
  const courseId = user?.preferences.activeCourseId ?? null;

  const path = useQuery({
    queryKey: ["path", courseId],
    enabled: Boolean(courseId),
    queryFn: () => apiCall<LearningPath>(`/api/v1/courses/${courseId}/path`),
  });

  if (!isClient) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <ErrorNotice message="Bạn cần đăng nhập để xem lộ trình học." />
        <Link href="/dang-nhap" className="text-[var(--color-brand-600)] underline">
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[var(--color-ink-600)]">Đang tải tài khoản…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <ErrorNotice message="Bạn cần đăng nhập để xem lộ trình học." />
        <Link href="/dang-nhap" className="text-[var(--color-brand-600)] underline">
          Tới trang đăng nhập
        </Link>
      </div>
    );
  }

  if (path.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-[var(--color-ink-600)]">Đang tải lộ trình…</p>
      </div>
    );
  }

  if (path.isError || !path.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorNotice message="Không tải được lộ trình học." />
      </div>
    );
  }

  const data = path.data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <header className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#08757a] bg-[#e6f7f8] px-3 py-1 rounded-full border border-[#b2e7e9] inline-block mb-2">
            Lộ trình học VSL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">{data.courseName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <Link
            href="/hanh-trinh"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E2DBD0] bg-[#F4EFE6] hover:bg-white px-5 py-3.5 font-bold text-[#0F172A] shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#0d9fa5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Hành trình cá nhân</span>
          </Link>

          {data.nextLessonId && (
            <Link
              href={`/hoc/bai/${data.nextLessonId}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-6 py-3.5 font-bold text-white shadow-xs transition-all hover:scale-102 cursor-pointer"
            >
              <span>Tiếp tục học</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </header>

      {data.units.map((unit) => (
        <section key={unit.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E2DBD0]">
            <h2 className="text-xl font-bold text-[#0F172A]">{unit.title}</h2>
            {unit.isFree ? (
              <span className="rounded-full bg-[#e6f7f8] border border-[#b2e7e9] px-3 py-1 text-xs font-bold text-[#08757a]">
                ✓ Miễn phí
              </span>
            ) : (
              <span className="rounded-full bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 text-xs font-bold text-[#B45309]">
                ★ Premium
              </span>
            )}
          </div>

          {unit.chapters.map((chapter) => (
            <div key={chapter.id} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#64748B]">{chapter.title}</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
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
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4.5 transition-all shadow-2xs ${
        blocked
          ? "border-[#E2DBD0] bg-[#EDE6DA]/40 text-[#94A3B8]"
          : "border-[#E2DBD0] bg-[#F4EFE6]/50 hover:bg-white hover:border-[#0d9fa5] hover:shadow-xs group cursor-pointer"
      }`}
    >
      <div>
        <p className={`font-bold text-sm sm:text-base ${blocked ? "text-[#94A3B8]" : "text-[#0F172A] group-hover:text-[#0d9fa5] transition-colors"}`}>
          {lesson.title}
        </p>
        <p className="text-xs text-[#64748B] mt-1 flex items-center gap-1.5">
          {lesson.status === "COMPLETED" && (
            <span className="text-[#0d9fa5] font-bold" aria-hidden="true">✓ </span>
          )}
          <span>{reason ?? statusLabel}</span>
          {lesson.bestScorePercent != null && (
            <span className="font-semibold text-[#0d9fa5]">· {lesson.bestScorePercent}%</span>
          )}
        </p>
      </div>
      {blocked ? (
        <span className="text-base select-none" aria-hidden="true">🔒</span>
      ) : (
        <span className="w-8 h-8 rounded-full bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0d9fa5] text-xs font-bold group-hover:bg-[#0d9fa5] group-hover:text-white group-hover:border-[#0d9fa5] transition-all">
          ▶
        </span>
      )}
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
