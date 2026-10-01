"use client";

import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Đang tải...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialRef);
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
            : "Không kết nối được Google. Thử lại hoặc đăng nhập bằng email.",
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
          referralCode: referralCode.trim() ? referralCode.trim() : undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      tokenStore.set(result.accessToken, result.refreshToken);
      dispatchAuthChange();
      // Sau dang ky: luon chuyen den trang xac nhan email (status = PENDING_VERIFICATION)
      router.push("/xac-nhan-email?email=" + encodeURIComponent(email));
    } catch (caught) {
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
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{t("Tạo tài khoản miễn phí", "Create your free account")}</h1>
          <p className="text-base text-ink-600 leading-relaxed">
            {t("Học ký hiệu đầu tiên chỉ trong 2 phút.", "Learn your first sign in 2 minutes.")}
          </p>
        </div>

        {/* Google Sign-up Button — duoc GIS render */}
        {GOOGLE_CLIENT_ID ? (
          <div id="google-signup-btn" className="w-full min-h-[44px]" />
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
            <label htmlFor="displayName" className="block text-sm font-semibold text-ink-800">
              {t("Tên hiển thị", "Display name")}
            </label>
            <input
              id="displayName"
              required
              minLength={2}
              maxLength={50}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-semibold text-ink-800">
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
              className="input"
            />
            <p id="password-hint" className="text-sm text-ink-600">
              {t("Ít nhất 10 ký tự, gồm cả chữ và số.", "At least 10 characters, including letters and numbers.")}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="referralCode" className="block text-sm font-semibold text-ink-800">
                {t("Mã giới thiệu (nếu có)", "Referral code (optional)")}
              </label>
              {referralCode && (
                <span className="text-xs font-semibold text-emerald-600">
                  {t("✓ Đã áp dụng", "✓ Applied")}
                </span>
              )}
            </div>
            <input
              id="referralCode"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="VD: SL8X9A2K"
              maxLength={20}
              className="input font-mono uppercase tracking-wider text-sm"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 rounded accent-brand-500 focus:ring-brand-500"
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
            className="btn btn-primary w-full"
          >
            {submitting ? t("Đang tạo tài khoản...", "Creating account...") : t("Tạo tài khoản", "Create Account")}
          </button>
        </form>

        <p className="text-sm text-ink-600 text-center">
          {t("Đã có tài khoản?", "Already have an account?")}{" "}
          <Link href="/dang-nhap" className="font-semibold text-brand-600 hover:underline">
            {t("Đăng nhập", "Log In")}
          </Link>
        </p>
      </div>
    </div>
  );
}
