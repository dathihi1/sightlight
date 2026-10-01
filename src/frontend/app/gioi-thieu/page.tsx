"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiCall } from "@/lib/api";
import { useAuthSession } from "@/lib/useAuthSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconCheck, IconCrown, IconStar } from "@/components/ui/Icons";

interface ReferralFriend {
  displayName: string;
  maskedEmail: string;
  joinedAt: string;
}

interface ReferralSummary {
  referralCode: string;
  referralLink: string;
  invitedCount: number;
  targetCount: number;
  canClaimReward: boolean;
  rewardClaimed: boolean;
  referredByCode: string | null;
  invitedFriends: ReferralFriend[];
}

export default function ReferralPage() {
  const { isClient, isLoggedIn, isLoading } = useAuthSession();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [claimingCode, setClaimingCode] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const referralQuery = useQuery({
    queryKey: ["referral-summary"],
    enabled: Boolean(isLoggedIn),
    queryFn: () => apiCall<ReferralSummary>("/api/v1/referral/summary"),
  });

  if (isClient && !isLoading && !isLoggedIn) {
    return (
      <EmptyState
        title="Đăng nhập để tham gia Giới thiệu bạn bè"
        body="Chia sẻ SignLight đến bạn bè để cùng học ngôn ngữ ký hiệu và nhận 1 tháng Premium miễn phí."
      >
        <Link href="/dang-nhap?next=/gioi-thieu" className="btn btn-primary">
          Đăng nhập ngay
        </Link>
        <Link href="/dang-ky" className="btn btn-secondary">
          Tạo tài khoản
        </Link>
      </EmptyState>
    );
  }

  if (!isClient || isLoading || referralQuery.isLoading) {
    return <EmptyState title="Đang tải thông tin giới thiệu…" mood="wow" />;
  }

  const data = referralQuery.data;
  const count = data?.invitedCount ?? 0;
  const target = data?.targetCount ?? 5;
  const progressPct = Math.min(100, Math.round((count / target) * 100));

  const handleCopy = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    try {
      setClaimingCode(true);
      setActionMsg(null);
      await apiCall("/api/v1/referral/claim-code", {
        method: "POST",
        body: {
          referralCode: inputCode.trim(),
        },
      });
      setActionMsg({
        type: "success",
        text: "Liên kết mã giới thiệu của bạn bè thành công!",
      });
      setInputCode("");
      referralQuery.refetch();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionMsg({
        type: "error",
        text: e.message || "Không thể liên kết mã giới thiệu. Vui lòng kiểm tra lại mã.",
      });
    } finally {
      setClaimingCode(false);
    }
  };

  const handleClaimReward = async () => {
    try {
      setClaimingReward(true);
      setActionMsg(null);
      await apiCall("/api/v1/referral/claim-reward", {
        method: "POST",
      });
      setActionMsg({
        type: "success",
        text: "🎉 Chúc mừng bạn đã nhận thành công 1 Tháng Premium miễn phí!",
      });
      referralQuery.refetch();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setActionMsg({
        type: "error",
        text: e.message || "Chưa thể nhận thưởng. Vui lòng thử lại sau.",
      });
    } finally {
      setClaimingReward(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Banner Giới thiệu */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <IconCrown className="h-4 w-4 text-amber-300" /> Chương trình Đại sứ SignLight
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl text-white">
            Mời 5 bạn mới tham gia — Nhận ngay 1 Tháng Premium miễn phí!
          </h1>
          <p className="mt-3 text-sm sm:text-base text-brand-100 leading-relaxed">
            Mỗi khi bạn mời 1 người bạn đăng ký học Ngôn ngữ Ký hiệu trên SignLight, cả hai đều cùng tiến bộ.
            Đạt mốc 5 người bạn để tự động nhận trọn vẹn 30 ngày trải nghiệm tính năng Premium không giới hạn!
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {actionMsg && (
        <div
          className={`mt-6 rounded-2xl p-4 text-sm font-semibold border ${
            actionMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-danger-50 text-danger-800 border-danger-200"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {/* Tiến độ mời bạn bè */}
      <div className="card mt-8 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Tiến độ nhận gói Premium</h2>
            <p className="text-xs text-ink-500 mt-1">
              Đã mời thành công <strong className="text-brand-600 text-sm">{count}</strong> / {target} bạn bè
            </p>
          </div>
          <div>
            {data?.rewardClaimed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800 border border-emerald-200">
                <IconCheck className="h-4 w-4 text-emerald-600" /> Đã nhận 1 Tháng Premium
              </span>
            ) : data?.canClaimReward ? (
              <button
                type="button"
                disabled={claimingReward}
                onClick={handleClaimReward}
                className="btn btn-primary font-bold text-sm shadow-md animate-pulse"
              >
                {claimingReward ? "Đang kích hoạt..." : "🎁 Kích hoạt 1 Tháng Premium ngay!"}
              </button>
            ) : (
              <span className="text-xs font-semibold text-ink-500 bg-ink-100 px-3.5 py-1.5 rounded-full">
                Còn thiếu {target - count} bạn nữa để mở khóa
              </span>
            )}
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="mt-5">
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs font-semibold text-ink-500">
            <span>0 bạn</span>
            <span className="text-brand-600">Mốc 5 bạn (Nhận 1 Tháng Premium)</span>
          </div>
        </div>
      </div>

      {/* Khối chia sẻ mã & liên kết */}
      <div className="grid gap-6 mt-8 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">Mã giới thiệu của bạn</h3>
          <p className="text-xs text-ink-600 mt-1">Bạn bè có thể nhập mã này khi đăng ký hoặc trong trang này.</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink-50 p-3.5 border border-ink-200">
            <span className="font-mono text-xl font-extrabold tracking-widest text-brand-600">
              {data?.referralCode || "Đang tạo..."}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(data?.referralCode || "", false)}
              className="btn btn-secondary btn-sm text-xs font-bold"
            >
              {copiedCode ? "Đã chép ✓" : "Sao chép mã"}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-ink-500">Liên kết mời nhanh</h3>
          <p className="text-xs text-ink-600 mt-1">Khi bạn bè mở link này, mã giới thiệu sẽ tự động được điền.</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-ink-50 p-2.5 border border-ink-200">
            <input
              type="text"
              readOnly
              value={data?.referralLink || ""}
              className="flex-1 bg-transparent px-2 text-xs font-mono text-ink-700 focus:outline-none truncate"
            />
            <button
              type="button"
              onClick={() => handleCopy(data?.referralLink || "", true)}
              className="btn btn-primary btn-sm text-xs font-bold shrink-0"
            >
              {copiedLink ? "Đã chép ✓" : "Sao chép link"}
            </button>
          </div>
        </div>
      </div>

      {/* Nhập mã của người giới thiệu */}
      <div className="card mt-8 p-6">
        <h3 className="text-base font-bold text-ink-900">Ủng hộ người bạn đã giới thiệu cho bạn</h3>
        {data?.referredByCode ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800">
            <IconCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Bạn đã liên kết với người giới thiệu: <strong>{data.referredByCode}</strong>
            </span>
          </div>
        ) : (
          <form onSubmit={handleClaimCode} className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nhập mã giới thiệu của bạn bè (ví dụ: SL123456)"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="input flex-1 uppercase font-mono text-sm tracking-wider"
              maxLength={20}
            />
            <button
              type="submit"
              disabled={claimingCode || !inputCode.trim()}
              className="btn btn-primary font-bold text-sm shrink-0"
            >
              {claimingCode ? "Đang liên kết..." : "Xác nhận liên kết"}
            </button>
          </form>
        )}
      </div>

      {/* Danh sách bạn bè đã tham gia */}
      <div className="card mt-8 p-6">
        <h3 className="text-base font-bold text-ink-900">
          Danh sách bạn bè đã tham gia ({data?.invitedFriends.length ?? 0})
        </h3>
        {data && data.invitedFriends.length > 0 ? (
          <div className="mt-4 divide-y divide-ink-100">
            {data.invitedFriends.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 font-bold text-sm">
                    {f.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{f.displayName}</p>
                    <p className="text-xs text-ink-500">{f.maskedEmail}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-ink-400">
                  {new Date(f.joinedAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-ink-500">
            Chưa có người bạn nào tham gia qua mã của bạn. Hãy gửi link cho bạn bè ngay nhé!
          </div>
        )}
      </div>
    </div>
  );
}
