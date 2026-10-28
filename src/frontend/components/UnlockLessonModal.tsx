"use client";

import { useState } from "react";
import { apiCall } from "@/lib/api";
import { IconGift, IconLock, IconStar } from "@/components/ui/Icons";

interface UnlockLessonModalProps {
  lesson: { id: string; title: string } | null;
  expBalance: number;
  ticketCount: number;
  onClose: () => void;
  onUnlocked: () => void;
}

const EXP_COST = 5000;

export function UnlockLessonModal({ lesson, expBalance, ticketCount, onClose, onUnlocked }: UnlockLessonModalProps) {
  const [loadingMethod, setLoadingMethod] = useState<"exp" | "ticket" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!lesson) return null;

  const unlock = async (method: "exp" | "ticket") => {
    setLoadingMethod(method);
    setError(null);
    try {
      await apiCall(`/api/v1/lessons/${lesson.id}/${method === "exp" ? "unlock-exp" : "unlock-ticket"}`, {
        method: "POST",
      });
      window.dispatchEvent(new CustomEvent("signlight:balance-update"));
      onUnlocked();
      onClose();
    } catch (err: unknown) {
      setError((err as { errorMessage?: string; message?: string })?.errorMessage
        || (err as { message?: string })?.message
        || "Chưa thể mở khóa bài học. Vui lòng thử lại.");
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="unlock-lesson-title">
      <div className="relative w-full max-w-md rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} disabled={loadingMethod !== null} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200" aria-label="Đóng">
          ×
        </button>
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><IconLock className="h-7 w-7" /></span>
          <h2 id="unlock-lesson-title" className="mt-3 text-xl font-bold text-ink-900">Mở khóa bài học</h2>
          <p className="mt-1 font-semibold text-brand-600">{lesson.title}</p>
          <p className="mt-2 text-sm text-ink-600">Hoàn thành bài liền trước vẫn mở bài này miễn phí. Bạn cũng có thể mở ngay để học tiếp.</p>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-700">{error}</p>}

        <div className="mt-6 grid gap-3">
          <button type="button" disabled={loadingMethod !== null || expBalance < EXP_COST} onClick={() => unlock("exp")} className="rounded-2xl border border-sun-300 bg-sun-50 p-4 text-left transition hover:border-sun-500 disabled:cursor-not-allowed disabled:opacity-55">
            <span className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold text-ink-900"><IconStar className="h-5 w-5 text-sun-500" />Dùng 5.000 EXP</span><span className="font-bold text-sun-700">{expBalance.toLocaleString("vi-VN")} EXP</span></span>
            <span className="mt-1 block text-xs text-ink-600">Mở khóa vĩnh viễn bài học này.</span>
            {expBalance < EXP_COST && <span className="mt-2 block text-xs font-semibold text-danger-700">Bạn cần thêm {(EXP_COST - expBalance).toLocaleString("vi-VN")} EXP.</span>}
            {loadingMethod === "exp" && <span className="mt-2 block text-xs font-bold text-sun-700">Đang mở khóa…</span>}
          </button>

          <button type="button" disabled={loadingMethod !== null || ticketCount < 1} onClick={() => unlock("ticket")} className="rounded-2xl border border-brand-300 bg-brand-50 p-4 text-left transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-55">
            <span className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 font-bold text-ink-900"><IconGift className="h-5 w-5 text-brand-600" />Dùng vé mở khóa</span><span className="font-bold text-brand-700">{ticketCount} vé</span></span>
            <span className="mt-1 block text-xs text-ink-600">Dùng 1 vé để mở khóa vĩnh viễn, không trừ EXP.</span>
            {ticketCount < 1 && <span className="mt-2 block text-xs font-semibold text-ink-500">Bạn chưa có vé mở khóa.</span>}
            {loadingMethod === "ticket" && <span className="mt-2 block text-xs font-bold text-brand-700">Đang mở khóa…</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
