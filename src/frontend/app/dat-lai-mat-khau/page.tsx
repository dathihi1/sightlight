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
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-4 text-center">
          <p className="text-[#64748B] text-sm leading-relaxed">
            {t("Liên kết không hợp lệ hoặc đã hết hiệu lực.", "The link is not valid or has expired.")}
          </p>
          <Link
            href="/quen-mat-khau"
            className="inline-block text-[#0d9fa5] font-bold hover:underline text-sm"
          >
            {t("Yêu cầu gửi lại liên kết mới", "Request a new link")}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-6 text-center">
          <div className="text-[#0d9fa5]">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {t("Mật khẩu đã được cập nhật", "Password updated")}
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
            {t(
              "Mật khẩu mới của bạn đã được lưu thành công. Bạn có thể đăng nhập và tiếp tục hành trình học tập ngay bây giờ.",
              "Your new password has been saved. Please log in with your new password to continue your learning journey.",
            )}
          </p>
          <Link
            href="/dang-nhap"
            className="inline-block rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-8 py-3 font-bold text-white transition-all shadow-xs"
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
        setError(t("Không kết nối được máy chủ.", "Cannot connect to server."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-extrabold text-[#0F172A]">
            {t("Đặt lại mật khẩu", "Reset Password")}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {t("Tạo mật khẩu mới an toàn cho tài khoản của bạn.", "Create a new secure password for your account.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-sm font-medium text-[#0F172A]">
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
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
            <p id="password-hint" className="text-xs text-[#64748B]">
              {t("Ít nhất 10 ký tự, gồm cả chữ và số.", "At least 10 characters, including letters and numbers.")}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0F172A]">
              {t("Xác nhận mật khẩu", "Confirm Password")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 ${
                passwordMismatch
                  ? "border-red-400 bg-red-50 focus:ring-red-400"
                  : "border-[#E2DBD0] bg-[#F4EFE6] focus:ring-[#0d9fa5]"
              }`}
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500">
                {t("Mật khẩu xác nhận không khớp.", "Passwords do not match.")}
              </p>
            )}
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting || !isValidPassword || !!passwordMismatch}
            className="w-full rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-4 py-3 font-bold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-[#E2DBD0] disabled:text-[#94A3B8] cursor-pointer"
          >
            {submitting
              ? t("Đang lưu mật khẩu...", "Saving...")
              : t("Lưu mật khẩu mới", "Save New Password")}
          </button>
        </form>

        <p className="text-sm text-[#64748B] text-center">
          <Link href="/quen-mat-khau" className="text-[#0d9fa5] font-semibold hover:underline">
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
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-center text-[#64748B]">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
