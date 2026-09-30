"use client";

import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
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
      const next = new URLSearchParams(window.location.search).get("next");
      const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/hoc";
      router.push(destination);
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
            : "Không kết nối được Google. Thử lại hoặc đăng nhập bằng email.",
        );
      } finally {
        setSubmitting(false);
      }
    };

    initializeGoogleSignIn(GOOGLE_CLIENT_ID, handleCredential);
    renderGoogleButton("google-signin-btn");
  }, [router]);

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
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:py-16">
      <div className="card p-7 sm:p-9 space-y-6">
        <div className="text-center space-y-2">
          <Mascot className="mx-auto mb-2 w-20" wave />
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{t("Chào mừng trở lại!", "Welcome back!")}</h1>
          <p className="text-base text-ink-600 leading-relaxed">
            {t("Đăng nhập để giữ chuỗi ngày học của bạn.", "Log in to keep your streak going.")}
          </p>
        </div>

        {/* Google Sign-in Button — duoc GIS render */}
        {GOOGLE_CLIENT_ID ? (
          <div id="google-signin-btn" className="w-full min-h-[44px]" />
        ) : null}

        {GOOGLE_CLIENT_ID && (
        <div className="relative flex items-center justify-center">
          <div className="grow border-t border-ink-100" />
          <span className="shrink-0 px-3 text-xs font-bold tracking-widest text-ink-500 bg-white uppercase">
          {t("hoặc với email", "or with email")}
          </span>
          <div className="grow border-t border-ink-100" />
        </div>
        )}

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
              className="input"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-ink-800">
              {t("Mật khẩu", "Password")}
              </label>
              <Link
                href="/quen-mat-khau"
                className="text-sm font-semibold text-brand-600 hover:underline"
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
              className="input"
            />
          </div>

          {error && <ErrorNotice message={error} />}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? t("Đang đăng nhập...", "Signing in...") : t("Đăng nhập", "Log In")}
          </button>
        </form>

        <p className="text-sm text-ink-600 text-center">
          {t("Chưa có tài khoản?", "Don't have an account?")}{" "}
          <Link href="/dang-ky" className="font-semibold text-brand-600 hover:underline">
            {t("Đăng ký miễn phí", "Sign up free")}
          </Link>
        </p>
      </div>
    </div>
  );
}
