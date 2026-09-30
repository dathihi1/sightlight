"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

/** SCR-08 — quen mat khau (FR-04). Luon hien thong bao thanh cong du email co ton tai hay khong. */
export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiCall<void>("/api/v1/auth/password/forgot", {
        method: "POST",
        auth: false,
        body: { email },
      });
      setSent(true);
    } catch (caught) {
      // Nen hien loi ket noi that su (network error), khong hien loi "email khong ton tai"
      if (caught instanceof ApiError && caught.httpStatus >= 500) {
        setError(t("Hệ thống đang gặp sự cố kết nối, vui lòng thử lại sau.", "Something went wrong, please try again later."));
      } else {
        // Moi loi khac (ke ca 400/404 tu server) => hien nhu thanh cong (chong enumeration)
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="card p-7 sm:p-9 space-y-6 text-center">
          <div className="text-brand-500">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {t("Đã gửi liên kết khôi phục", "Link sent")}
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            {t(
              "Nếu địa chỉ email hợp lệ, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Vui lòng kiểm tra cả mục Thư rác (Spam).",
              "If the email address is valid, you will receive a password reset link within a few minutes. Please also check your spam folder.",
            )}
          </p>
          <Link
            href="/dang-nhap"
            className="btn btn-primary"
          >
            {t("Quay lại đăng nhập", "Back to login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="card p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {t("Quên mật khẩu", "Forgot Password")}
          </h1>
          <p className="text-base text-ink-600 leading-relaxed">
            {t(
              "Đừng lo lắng, hãy nhập email để SignLight gửi liên kết khôi phục quyền truy cập bài học.",
              "Don't worry, enter your email so SignLight can send you a link to restore access to your lessons.",
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-semibold text-ink-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              className="input"
            />
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting || !email}
            className="btn btn-primary w-full"
          >
            {submitting
              ? t("Đang gửi liên kết...", "Sending link...")
              : t("Gửi liên kết đặt lại mật khẩu", "Send reset link")}
          </button>
        </form>

        <p className="text-sm text-ink-600 text-center">
          <Link href="/dang-nhap" className="font-semibold text-brand-600 hover:underline">
            {t("Quay lại đăng nhập", "Back to login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
