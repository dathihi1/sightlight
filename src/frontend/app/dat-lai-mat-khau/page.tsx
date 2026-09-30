"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

function ResetPasswordContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = confirmPassword && newPassword !== confirmPassword;
  const isValidPassword = newPassword.length >= 10
    && /[a-zA-Z]/.test(newPassword)
    && /[0-9]/.test(newPassword);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className="card p-7 sm:p-9 space-y-4 text-center">
          <p className="text-ink-600 text-sm leading-relaxed">
            {t("Liên kết không hợp lệ hoặc đã hết hiệu lực.", "The link is not valid or has expired.")}
          </p>
          <Link
            href="/quen-mat-khau"
            className="inline-block font-semibold text-brand-600 hover:underline text-sm"
          >
            {t("Yêu cầu gửi lại liên kết mới", "Request a new link")}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
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
            {t("Mật khẩu đã được cập nhật", "Password updated")}
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            {t(
              "Mật khẩu mới của bạn đã được lưu thành công. Bạn có thể đăng nhập và tiếp tục hành trình học tập ngay bây giờ.",
              "Your new password has been saved. Please log in with your new password to continue your learning journey.",
            )}
          </p>
          <Link
            href="/dang-nhap"
            className="btn btn-primary"
          >
            {t("Đăng nhập ngay", "Log In")}
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPassword || passwordMismatch) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiCall<void>("/api/v1/auth/password/reset", {
        method: "POST",
        auth: false,
        body: { token, newPassword },
      });
      setSuccess(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.errorCode === "01107" || caught.errorCode === "01108") {
          setError(t(
            "Liên kết không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.",
            "The link is not valid or has expired. Please request a new link.",
          ));
        } else {
          setError(caught.errorMessage);
        }
      } else {
        setError(t("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.", "Can't reach the server. Check your connection and try again."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="card p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {t("Đặt lại mật khẩu", "Reset Password")}
          </h1>
          <p className="text-base text-ink-600 leading-relaxed">
            {t("Tạo mật khẩu mới an toàn cho tài khoản của bạn.", "Create a new secure password for your account.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-sm font-semibold text-ink-800">
              {t("Mật khẩu mới", "New Password")}
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              aria-describedby="password-hint"
              className="input"
            />
            <p id="password-hint" className="text-sm text-ink-600">
              {t("Ít nhất 10 ký tự, gồm cả chữ và số.", "At least 10 characters, including letters and numbers.")}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-ink-800">
              {t("Xác nhận mật khẩu", "Confirm Password")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`input ${passwordMismatch ? "border-danger-400 bg-danger-50" : ""}`}
            />
            {passwordMismatch && (
              <p className="text-xs text-danger-500">
                {t("Mật khẩu xác nhận không khớp.", "Passwords do not match.")}
              </p>
            )}
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting || !isValidPassword || !!passwordMismatch}
            className="btn btn-primary w-full"
          >
            {submitting
              ? t("Đang lưu mật khẩu...", "Saving...")
              : t("Lưu mật khẩu mới", "Save New Password")}
          </button>
        </form>

        <p className="text-sm text-ink-600 text-center">
          <Link href="/quen-mat-khau" className="font-semibold text-brand-600 hover:underline">
            {t("Yêu cầu liên kết mới", "Request a new link")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** SCR-09 — dat lai mat khau bang token (FR-04). */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-center text-ink-600">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
