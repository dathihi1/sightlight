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

interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  roles: string[];
  activeCourseId: string | null;
  requiresEmailVerification: boolean;
  pendingDeletion: boolean;
}

/** SCR-03 — dang nhap (FR-02). */
export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginResult = (result: LoginResult) => {
    tokenStore.set(result.accessToken, result.refreshToken);
    dispatchAuthChange();
    if (result.requiresEmailVerification) {
      router.push("/xac-nhan-email?email=" + encodeURIComponent(email || ""));
    } else {
      router.push("/hoc");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      setError(null);
      setSubmitting(true);
      try {
        const result = await apiCall<LoginResult>("/api/v1/auth/google", {
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
    renderGoogleButton("google-signin-btn");
  }, [router]);

  async function handleDemoLogin() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall<LoginResult>("/api/v1/auth/demo-login", {
        method: "POST",
        auth: false,
      });
      handleLoginResult(result);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không đăng nhập thử nghiệm được.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiCall<LoginResult>("/api/v1/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      handleLoginResult(result);
    } catch (caught) {
      // Thong diep lay tu server: co y khong phan biet sai email hay sai mat khau (NFR-08).
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-[#E2DBD0] shadow-sm space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-extrabold text-[#0F172A]">{t("Chào mừng trở lại", "Welcome Back")}</h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {t("Tiếp tục hành trình thấu hiểu và sẻ chia yêu thương cùng người thân", "Continue your journey of understanding and connecting with loved ones")}
          </p>
        </div>

        {/* Demo / Bypass Login Button */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[#0d9fa5] bg-[#e6f7f8]/60 hover:bg-[#e6f7f8] text-[#0d9fa5] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Đăng nhập thử nghiệm (Bypass để test)</span>
        </button>

        {/* Google Sign-in Button — duoc GIS render */}
        {GOOGLE_CLIENT_ID ? (
          <div id="google-signin-btn" className="w-full min-h-[44px]" />
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-[#0F172A]">
              {t("Mật khẩu", "Password")}
              </label>
              <Link
                href="/quen-mat-khau"
                className="text-xs text-[#0d9fa5] hover:underline font-medium"
              >
                {t("Quên mật khẩu?", "Forgot password?")}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#E2DBD0] bg-[#F4EFE6] px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9fa5]"
            />
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#0d9fa5] hover:bg-[#0a8287] px-4 py-3 font-bold text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:bg-[#E2DBD0] disabled:text-[#94A3B8] cursor-pointer"
          >
            {submitting ? t("Đang đăng nhập...", "Signing in...") : t("Đăng nhập", "Log In")}
          </button>
        </form>

        <p className="text-sm text-[#64748B] text-center">
          {t("Chưa có tài khoản?", "Don't have an account?")}{" "}
          <Link href="/dang-ky" className="text-[#0d9fa5] font-bold hover:underline">
            {t("Đăng ký miễn phí", "Sign up free")}
          </Link>
        </p>
      </div>
    </div>
  );
}
