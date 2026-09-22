"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { dispatchAuthChange } from "@/lib/useAuthSession";
import { useLanguage } from "@/context/LanguageContext";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import {
  GoogleCredentialResponse,
  initializeGoogleSignIn,
  renderGoogleButton,
} from "@/lib/googleAuth";

interface RegisterResult {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  status: string;
  activeCourseId: string | null;
}

interface GoogleLoginResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  roles: string[];
  activeCourseId: string | null;
  requiresEmailVerification: boolean;
  pendingDeletion: boolean;
}

/** SCR-06 — dang ky (FR-01). Mat khau 10-128 ky tu, phai co ca chu va so. */
export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      setError(null);
      setSubmitting(true);
      try {
        const result = await apiCall<GoogleLoginResult>("/api/v1/auth/google", {
          method: "POST",
          auth: false,
          body: { idToken: response.credential },
        });
        tokenStore.set(result.accessToken, result.refreshToken);
        dispatchAuthChange();
        if (result.requiresEmailVerification) {
          router.push("/xac-nhan-email");
        } else {
          router.push("/hoc");
        }
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.errorMessage
            : "Không kết nối được dịch vụ Google.",
        );
      } finally {
        setSubmitting(false);
      }
    };

    initializeGoogleSignIn(GOOGLE_CLIENT_ID, handleCredential);
    renderGoogleButton("google-signup-btn");
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall<RegisterResult>("/api/v1/auth/register", {
        method: "POST",
        auth: false,
        body: {
          displayName,
          email,
          password,
          acceptedTerms,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      tokenStore.set(result.accessToken, result.refreshToken);
      dispatchAuthChange();
      // Sau dang ky: luon chuyen den trang xac nhan email (status = PENDING_VERIFICATION)
      router.push("/xac-nhan-email?email=" + encodeURIComponent(email));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-extrabold text-[#0F172A]">{t("Bắt đầu hành trình kết nối", "Begin Your Journey to Connect")}</h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {t("Mở rộng trái tim và cất lời bằng đôi bàn tay cùng SignLight — Hoàn toàn miễn phí", "Open your heart and speak with your hands with SignLight — 100% free")}
          </p>
        </div>

        {/* Google Sign-up Button — duoc GIS render */}
        {GOOGLE_CLIENT_ID ? (
          <div id="google-signup-btn" className="w-full min-h-[44px]" />
        ) : null}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="grow border-t border-[#E2DBD0]" />
          <span className="shrink-0 px-3 text-xs font-semibold text-[#64748B] bg-white uppercase">
          {t("hoặc với email", "or with email")}
          </span>
          <div className="grow border-t border-[#E2DBD0]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="displayName" className="block text-sm font-medium text-[#0F172A]">
              {t("Tên hiển thị", "Full Name")}
            </label>
            <input
              id="displayName"
              required
              minLength={2}
              maxLength={50}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-[#0F172A]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-[#0F172A]">
              {t("Mật khẩu", "Password")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="password-hint"
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
            <p id="password-hint" className="text-xs text-[#64748B]">
              {t("Ít nhất 10 ký tự, gồm cả chữ và số.", "At least 10 characters, including letters and numbers.")}
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-[#475569]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 rounded accent-[#0d9fa5] focus:ring-[#0d9fa5]"
            />
            <span>
              {t(
                "Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.",
                "I agree to the Terms of Service and Privacy Policy.",
              )}
            </span>
          </label>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-4 py-3 font-bold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-[#E2DBD0] disabled:text-[#94A3B8] cursor-pointer"
          >
            {submitting ? t("Đang tạo tài khoản...", "Creating account...") : t("Tạo tài khoản", "Create Account")}
          </button>
        </form>

        <p className="text-sm text-[#64748B] text-center">
          {t("Đã có tài khoản?", "Already have an account?")}{" "}
          <Link href="/dang-nhap" className="text-[#0d9fa5] font-bold hover:underline">
            {t("Đăng nhập", "Log In")}
          </Link>
        </p>
      </div>
    </div>
  );
}
