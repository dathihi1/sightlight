"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ApiError, apiCall, tokenStore } from "@/lib/api";

interface LoginResult {
  accessToken: string;
  userId: string;
  roles: string[];
  activeCourseId: string | null;
  requiresEmailVerification: boolean;
  pendingDeletion: boolean;
}

/** SCR-03 — đăng nhập (FR-02). */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      tokenStore.set(result.accessToken);
      router.push("/hoc");
    } catch (caught) {
      // Thông điệp lấy từ server: cố ý không phân biệt sai email hay sai mật khẩu (NFR-08).
      setError(caught instanceof ApiError ? caught.errorMessage : "Không kết nối được máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Đăng nhập</h1>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-transparent px-3 py-2"
          />
        </div>

        {error && <ErrorNotice message={error} />}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[var(--color-brand-600)] px-4 py-3 font-medium text-white hover:bg-[var(--color-brand-700)] disabled:cursor-not-allowed disabled:bg-[var(--color-border-default)] disabled:text-[var(--color-ink-400)]"
        >
          {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="text-sm text-[var(--color-ink-600)]">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className="text-[var(--color-brand-600)] underline">
          Đăng ký miễn phí
        </Link>
      </p>
    </div>
  );
}
