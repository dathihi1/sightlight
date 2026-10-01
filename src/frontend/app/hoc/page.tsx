"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconArrowRight, IconCheck, IconCrown, IconFlame, IconLock, IconStar, IconTarget, IconShop } from "@/components/ui/Icons";
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

/** GET /api/v1/gamification/summary — GamificationSummaryResult. */
interface Summary {
  streakDays: number;
  longestStreak: number;
  goalMetToday: boolean;
  dailyGoalMinutes: number;
  totalMinutesLearned: number;
  completedLessons: number;
  signsMastered: number;
  averageScore: number;
  expBalance: number;
  recentActivities: { date: string; minutes: number; goalMinutes: number; goalMet: boolean }[];
}

const lessonsOf = (u: UnitNode) => u.chapters.flatMap((c) => c.lessons);
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Tuần hiện tại (Thứ Hai → Chủ nhật) ghép với nhật ký học theo ngày. */
function currentWeek(activities: Summary["recentActivities"]) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const byDate = new Map(activities.map((a) => [a.date, a]));
  return WEEKDAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const a = byDate.get(isoDay(d));
    return { label, day: d.getDate(), minutes: Math.round(Number(a?.minutes ?? 0)), goalMet: Boolean(a?.goalMet), isToday: isoDay(d) === isoDay(today) };
  });
}

/** SCR-08 — Tổng quan học tập (FR-09): tiếp tục học, lộ trình, và cột chỉ số cá nhân. */
export default function LearningPathPage() {
  const { isClient, isLoggedIn, isLoading, user } = useAuthSession();
  const courseId = user?.preferences.activeCourseId ?? null;

  const path = useQuery({
    queryKey: ["path", courseId],
    enabled: Boolean(courseId),
    queryFn: () => apiCall<LearningPath>(`/api/v1/courses/${courseId}/path`),
  });
  const summary = useQuery({
    queryKey: ["gamification-summary", courseId],
    enabled: Boolean(isLoggedIn && courseId),
    queryFn: () => apiCall<Summary>(`/api/v1/gamification/summary?courseId=${courseId}`),
  });

  useEffect(() => {
    const handleBalanceUpdate = () => {
      summary.refetch();
    };
    window.addEventListener("signlight:balance-update", handleBalanceUpdate);
    return () => window.removeEventListener("signlight:balance-update", handleBalanceUpdate);
  }, [summary]);

  if (isClient && !isLoading && !isLoggedIn) {
    return (
      <EmptyState title="Đăng nhập để bắt đầu học" body="Lộ trình, tiến độ và chuỗi ngày học của bạn được lưu theo tài khoản.">
        <Link href="/dang-nhap?next=/hoc" className="btn btn-primary">
          Đăng nhập
        </Link>
        <Link href="/dang-ky" className="btn btn-secondary">
          Tạo tài khoản
        </Link>
      </EmptyState>
    );
  }

  if (!isClient || isLoading || path.isLoading) {
    return <EmptyState title="Đang tải lộ trình…" mood="wow" />;
  }

  if (!courseId) {
    return <EmptyState title="Chưa có khoá học nào" body="Khoá học đầu tiên đang được chuẩn bị. Quay lại sau nhé!" mood="sad" />;
  }

  if (path.isError || !path.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorNotice message="Không tải được lộ trình học. Tải lại trang để thử lại." />
      </div>
    );
  }

  const data = path.data;
  const all = data.units.flatMap(lessonsOf);
  const doneCount = all.filter((l) => l.status === "COMPLETED").length;
  const coursePct = Math.round((doneCount / Math.max(all.length, 1)) * 100);

  // Thẻ "Tiếp tục học": chủ đề đang học dở + chủ đề chứa bài tiếp theo, tối đa 2.
  const active = data.units
    .map((u, idx) => ({ u, idx }))
    .filter(({ u }) => {
      const ls = lessonsOf(u);
      const done = ls.filter((l) => l.status === "COMPLETED").length;
      return ls.some((l) => l.id === data.nextLessonId) || (done > 0 && done < ls.length);
    })
    .slice(0, 2);

  return (
    <div className="grid gap-8 p-4 sm:p-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tiếp tục học</h1>
          <p className="text-sm text-ink-600">{data.courseName}</p>
        </div>

        <div className={`mt-5 grid gap-4 ${active.length > 1 ? "md:grid-cols-2" : ""}`}>
          {(active.length ? active : data.units.slice(0, 1).map((u, idx) => ({ u, idx }))).map(({ u, idx }) => (
            <ContinueCard key={u.id} unit={u} index={idx} nextLessonId={data.nextLessonId} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-ink-900">Lộ trình học</h2>
          <div className="flex w-full items-center gap-3 sm:w-72">
            <div className="progress flex-1" role="progressbar" aria-valuenow={coursePct} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ khoá học">
              <span style={{ width: `${Math.max(coursePct, 2)}%` }} />
            </div>
            <span className="shrink-0 text-sm font-medium text-ink-600">
              {doneCount}/{all.length} bài
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {data.units.map((unit, idx) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              index={idx}
              nextLessonId={data.nextLessonId}
              defaultOpen={lessonsOf(unit).some((l) => l.id === data.nextLessonId) || (idx === 0 && !data.nextLessonId)}
            />
          ))}
        </div>
      </div>

      <aside className="space-y-5" aria-label="Thống kê cá nhân">
        <ProfileCard name={user?.profile?.displayName ?? "Học viên"} coursePct={coursePct} summary={summary.data} />
        {summary.data ? (
          <>
            <WeekStreak summary={summary.data} />
            <WeekMinutes summary={summary.data} />
          </>
        ) : summary.isError ? (
          <p className="card p-5 text-sm text-ink-600">Chưa tải được thống kê học tập. Tải lại trang để thử lại.</p>
        ) : null}
      </aside>
    </div>
  );
}

function ContinueCard({ unit, index, nextLessonId }: { unit: UnitNode; index: number; nextLessonId: string | null }) {
  const ls = lessonsOf(unit);
  const done = ls.filter((l) => l.status === "COMPLETED").length;
  const pct = Math.round((done / Math.max(ls.length, 1)) * 100);
  const target = ls.find((l) => l.id === nextLessonId) ?? ls.find((l) => l.status !== "COMPLETED" && !l.locked && !l.premiumLocked);

  return (
    <article className="rounded-3xl border border-ink-200 bg-white p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">{index + 1}</span>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-ink-900">{unit.title}</h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Chủ đề {index + 1} · {unit.isFree ? "Miễn phí" : "Premium"}
          </p>
        </div>
      </div>
      <div className="progress mt-5" aria-hidden="true">
        <span style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-sm text-ink-600">
        <span>
          {done}/{ls.length} bài
        </span>
        <span>{pct}%</span>
      </div>
      {target ? (
        <Link href={`/hoc/bai-moi/${target.id}`} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline">
          {target.status === "IN_PROGRESS" ? "Học tiếp" : "Bắt đầu"}: {target.title}
          <IconArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <p className="mt-4 text-sm text-ink-600">{done === ls.length ? "Đã hoàn thành chủ đề" : "Cần mở khoá để học tiếp"}</p>
      )}
    </article>
  );
}

function UnitSection({ unit, index, nextLessonId, defaultOpen }: { unit: UnitNode; index: number; nextLessonId: string | null; defaultOpen: boolean }) {
  const ls = lessonsOf(unit);
  const done = ls.filter((l) => l.status === "COMPLETED").length;
  return (
    <details open={defaultOpen} className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink-50 font-semibold text-ink-700">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink-900">{unit.title}</p>
          <p className="text-sm text-ink-600">
            {done}/{ls.length} bài đã xong
          </p>
        </div>
        {!unit.isFree && (
          <span className="chip bg-grape-50 text-grape-700">
            <IconCrown className="h-4 w-4" /> Premium
          </span>
        )}
        <svg className="h-5 w-5 shrink-0 text-ink-500 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-ink-200 px-5 py-4">
        {unit.chapters.map((chapter) => (
          <div key={chapter.id} className="mb-4 last:mb-0">
            <h3 className="mb-2 text-sm font-semibold text-ink-500">{chapter.title}</h3>
            <ol>
              {chapter.lessons.map((lesson, i) => (
                <LessonRow key={lesson.id} lesson={lesson} isNext={lesson.id === nextLessonId} isLast={i === chapter.lessons.length - 1} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </details>
  );
}

function LessonRow({ lesson, isNext, isLast }: { lesson: LessonNode; isNext: boolean; isLast: boolean }) {
  // Hai loại khoá cần hai thông điệp khác nhau (BR-A12 vs BR-A14) — gộp lại là người học hiểu sai.
  const reason = lesson.premiumLocked ? "Cần gói Premium" : lesson.locked ? "Học xong bài trước để mở" : null;
  const done = lesson.status === "COMPLETED";
  const current = !reason && (isNext || lesson.status === "IN_PROGRESS");
  const status = reason ?? (done ? "Đã hoàn thành" : lesson.status === "IN_PROGRESS" ? "Đang học" : "Chưa học");

  const dot = done ? (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">
      <IconCheck className="h-4 w-4" />
    </span>
  ) : reason ? (
    <span className={`grid h-8 w-8 place-items-center rounded-full ${lesson.premiumLocked ? "bg-grape-50 text-grape-600" : "bg-ink-100 text-ink-400"}`}>
      {lesson.premiumLocked ? <IconCrown className="h-4 w-4" /> : <IconLock className="h-3.5 w-3.5" />}
    </span>
  ) : (
    <span className={`grid h-8 w-8 place-items-center rounded-full border-2 bg-white ${current ? "border-brand-500" : "border-ink-300"}`}>
      {current && <span className="h-3 w-3 rounded-full bg-brand-500" />}
    </span>
  );

  const body = (
    <div className={`flex flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-colors ${current ? "bg-brand-50" : reason ? "" : "group-hover:bg-ink-50"}`}>
      <div className="min-w-0">
        <p className={`truncate text-base font-medium ${reason ? "text-ink-500" : "text-ink-900"}`}>{lesson.title}</p>
        <p className="text-sm text-ink-600">
          {status}
          {lesson.bestScorePercent != null && ` · điểm cao nhất ${lesson.bestScorePercent}%`}
        </p>
      </div>
      {current && <span className="btn btn-primary btn-sm pointer-events-none">{lesson.status === "IN_PROGRESS" ? "Tiếp tục" : "Bắt đầu"}</span>}
    </div>
  );

  return (
    <li className="relative flex gap-3">
      {!isLast && <span className="absolute bottom-0 left-4 top-11 w-px -translate-x-1/2 bg-ink-200" aria-hidden="true" />}
      <div className="pt-3.5">{dot}</div>
      {reason ? (
        <div aria-disabled="true" className="flex flex-1 cursor-not-allowed pb-1">
          {body}
        </div>
      ) : (
        <Link href={`/hoc/bai-moi/${lesson.id}`} className="group flex flex-1 rounded-2xl pb-1" aria-label={`${lesson.title} — ${status}`}>
          {body}
        </Link>
      )}
    </li>
  );
}

function ProfileCard({ name, coursePct, summary }: { name: string; coursePct: number; summary?: Summary }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const stats = summary
    ? [
        { icon: <IconFlame className="h-6 w-6" />, value: summary.streakDays, label: "Ngày liên tiếp" },
        { icon: <IconCheck className="h-5 w-5 text-brand-600" />, value: summary.signsMastered, label: "Ký hiệu đã thuộc" },
        { icon: <IconTarget className="h-5 w-5 text-sky-600" />, value: `${summary.averageScore}%`, label: "Độ chuẩn AI" },
      ]
    : [];

  return (
    <section className="card p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" role="img" aria-label={`Hoàn thành ${coursePct}% khoá học`}>
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth="5" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-brand-400)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(coursePct / 100) * c} ${c}`} />
          </svg>
          <span className="absolute inset-2 grid place-items-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600">{name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink-900">{name}</p>
          <p className="text-sm text-ink-600">Hoàn thành {coursePct}% khoá học</p>
          {summary && (
            <div className="mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-bold text-sun-900">
                <IconStar className="h-4 w-4 text-sun-500" /> {summary.expBalance} XP
              </span>
              <Link
                href="/cua-hang"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-0.5"
              >
                Đổi quà &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
      {summary && (
        <>
          <ul className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-ink-50 p-3 text-center">
            {stats.map((s) => (
              <li key={s.label}>
                <p className="flex items-center justify-center gap-1 text-xl font-bold text-ink-900">
                  {s.icon}
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-ink-600">{s.label}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-ink-100 pt-3">
            <Link
              href="/cua-hang"
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-sun-50 to-brand-50 hover:from-sun-100 hover:to-brand-100 p-3 transition text-xs font-bold text-ink-900 border border-sun-200 shadow-xs"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🎁</span>
                <span>Cửa hàng đổi thưởng EXP</span>
              </span>
              <span className="text-brand-600 font-extrabold">&rarr;</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

function WeekStreak({ summary }: { summary: Summary }) {
  const week = currentWeek(summary.recentActivities);
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">Chuỗi tuần này</h2>
        <span className="chip bg-brand-50 text-brand-700">
          <IconFlame className="h-4 w-4" /> {summary.streakDays} ngày
        </span>
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1.5 border-t border-ink-200 pt-4">
        {week.map((d) => (
          <li
            key={d.label}
            className={`flex flex-col items-center rounded-2xl py-2 ${
              d.goalMet ? "bg-brand-500 text-white" : d.isToday ? "border border-brand-300 text-ink-900" : "text-ink-700"
            }`}
          >
            <span className={`text-xs ${d.goalMet ? "text-white/90" : "text-ink-500"}`}>{d.label}</span>
            <span className="text-lg font-semibold">{d.day}</span>
            <span className="sr-only">{d.goalMet ? "đạt mục tiêu" : "chưa đạt mục tiêu"}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-ink-600">
        {summary.goalMetToday ? "Hôm nay đã đạt mục tiêu." : `Mục tiêu mỗi ngày: ${summary.dailyGoalMinutes} phút.`} Dài nhất: {summary.longestStreak} ngày.
      </p>
    </section>
  );
}

function WeekMinutes({ summary }: { summary: Summary }) {
  const week = currentWeek(summary.recentActivities);
  const max = Math.max(summary.dailyGoalMinutes, ...week.map((d) => d.minutes), 1);
  const total = week.reduce((s, d) => s + d.minutes, 0);
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink-900">Thời gian học tuần này</h2>
        <span className="text-sm font-medium text-ink-600">{total} phút</span>
      </div>
      <div
        className="mt-4 flex h-36 items-end gap-2 border-t border-ink-200 pt-4"
        role="img"
        aria-label={`Số phút học: ${week.map((d) => `${d.label} ${d.minutes} phút`).join(", ")}`}
      >
        {week.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            {d.isToday && d.minutes > 0 && <span className="rounded-md bg-ink-900 px-1.5 py-0.5 text-xs font-semibold text-white">{d.minutes}p</span>}
            <div
              className={`w-full rounded-lg ${d.isToday ? "" : d.minutes > 0 ? "bg-brand-100" : "bg-ink-100"}`}
              style={{
                height: `${Math.max((d.minutes / max) * 100, 6)}%`,
                background: d.isToday ? "repeating-linear-gradient(-45deg, var(--color-brand-400) 0 6px, #7aa3f9 6px 12px)" : undefined,
              }}
            />
            <span className={`text-xs ${d.isToday ? "font-semibold text-brand-600" : "text-ink-500"}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
