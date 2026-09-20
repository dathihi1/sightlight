"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall, tokenStore } from "@/lib/api";

interface RegisterResult {
  userId: string;
  accessToken: string;
  status: string;
  activeCourseId: string | null;
}

/** SCR-06 — đăng ký (FR-01). Mật khẩu 10–128 ký tự, phải có cả chữ và số. */
export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      tokenStore.set(result.accessToken);
      router.push("/hoc");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Tạo tài khoản</h1>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="displayName" className="block text-sm font-medium">
            Tên hiển thị
          </label>
          <input
            id="displayName"
            required
            minLength={2}
            maxLength={50}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Mật khẩu
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
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
          />
          <p id="password-hint" className="text-xs text-[var(--color-ink-600)]">
            Ít nhất 10 ký tự, gồm cả chữ và số.
          </p>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1"
          />
          <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư.</span>
        </label>

        {error && <ErrorNotice message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-3 font-medium text-white hover:bg-[var(--color-brand-700)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-default)] disabled:text-[var(--color-ink-400)]"
        >
          {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </button>
      </form>

      <p className="text-sm text-[var(--color-ink-600)]">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className="text-[var(--color-brand-600)] underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
