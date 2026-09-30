"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** SCR-10 — Chuyển hướng người học sang giao diện bài học chuẩn mới */
export default function LessonRedirectPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const lessonId = params?.lessonId;

  useEffect(() => {
    if (lessonId) {
      router.replace(`/hoc/bai-moi/${lessonId}`);
    }
  }, [lessonId, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-[var(--color-ink-600)]">Đang chuyển đến giao diện bài học mới…</p>
    </div>
  );
}
