"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { dispatchAuthChange } from "@/lib/useAuthSession";
import { useLanguage } from "@/context/LanguageContext";

interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  roles: string[];
  activeCourseId: string | null;
  requiresEmailVerification: boolean;
  pendingDeletion: boolean;
}

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

function OtpVerificationContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParam = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [email, setEmail] = useState(emailFromParam);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const otpValue = otp.join("");

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const nextEmpty = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextEmpty]?.focus();
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (otpValue.length < OTP_LENGTH) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall<LoginResult>("/api/v1/auth/email/verify", {
        method: "POST",
        auth: false,
        body: { email, otp: otpValue },
      });
      tokenStore.set(result.accessToken, result.refreshToken);
      dispatchAuthChange();
      router.push("/hoc");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setError(null);
    setResendSuccess(false);
    try {
      await apiCall<void>("/api/v1/auth/email/resend", {
        method: "POST",
        auth: false,
        body: { email },
      });
      setResendSuccess(true);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không gửi lại được mã xác nhận.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="card p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2 text-brand-500">
            <svg className="w-14 h-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {t("Xác nhận email", "Verify Your Email")}
          </h1>
          <p className="text-sm text-ink-600">
            {t(
              "Chúng tôi đã gửi mã xác thực 6 số đến",
              "We sent a 6-digit verification code to",
            )}
          </p>
          {email && (
            <p className="text-sm text-ink-900 break-all">{email}</p>
          )}
          {!email && (
            <div className="space-y-1">
              <label htmlFor="email-input" className="block text-sm font-semibold text-ink-800 text-left">
                Email
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm font-medium text-ink-900 mb-3 text-center">
              {t("Nhập mã xác nhận 6 chữ số", "Enter 6-digit code")}
            </p>
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-2xl border border-ink-200 bg-ink-50 focus:bg-white focus:outline-none focus:border-sky-400 transition-colors"
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {resendSuccess && (
            <p className="text-sm text-brand-600 text-center">
              {t("Đã gửi lại mã mới. Vui lòng kiểm tra hộp thư của bạn.", "A new code has been sent. Please check your email.")}
            </p>
          )}

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting || otpValue.length < OTP_LENGTH}
            className="btn btn-primary w-full"
          >
            {submitting
              ? t("Đang xác nhận...", "Verifying...")
              : t("Xác nhận email và vào học", "Verify and Start Learning")}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-ink-600">
            {t("Chưa nhận được mã xác thực?", "Did not receive the code?")}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCountdown > 0}
            className="text-sm font-semibold text-brand-600 hover:underline disabled:text-ink-500 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
          >
            {resendCountdown > 0
              ? t(`Gửi lại sau ${resendCountdown}s`, `Resend in ${resendCountdown}s`)
              : t("Gửi lại mã", "Resend code")}
          </button>
        </div>

        <p className="text-sm text-ink-600 text-center">
          <Link href="/dang-nhap" className="font-semibold text-brand-600 hover:underline">
            {t("Quay lại đăng nhập", "Back to login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/** SCR-07 — xac nhan email bang OTP (FR-01b). */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-center text-ink-600">Đang tải...</div>}>
      <OtpVerificationContent />
    </Suspense>
  );
}
