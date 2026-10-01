"use client";

import { useEffect, useState, useRef } from "react";
import { apiCall, ApiError } from "@/lib/api";
import { dispatchAuthChange } from "@/lib/useAuthSession";
import { useLanguage } from "@/context/LanguageContext";

export interface AdRewardResult {
  rewardType: string;
  amountGranted: number;
  newExpBalance: number;
  newAiBonusQuota: number;
  message: string;
}

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardType: "AI_QUOTA" | "EXP";
  placement?: string;
  onSuccess?: (result: AdRewardResult) => void;
}

const AD_DURATION_SECONDS = 15;

export function RewardedAdModal({
  isOpen,
  onClose,
  rewardType,
  placement = "GENERIC_MODAL",
  onSuccess,
}: RewardedAdModalProps) {
  const { t } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedResult, setClaimedResult] = useState<AdRewardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(AD_DURATION_SECONDS);
      setIsCompleted(false);
      setIsClaiming(false);
      setClaimedResult(null);
      setError(null);
      setShowExitConfirm(false);
      return;
    }

    setSecondsLeft(AD_DURATION_SECONDS);
    setIsCompleted(false);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    setIsClaiming(true);
    setError(null);
    try {
      const res = await apiCall<AdRewardResult>("/api/v1/ads/claim-reward", {
        method: "POST",
        body: {
          rewardType,
          placement,
        },
      });
      setClaimedResult(res);
      // Dispatch custom events to refresh balance, profile and quests across the app
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("signlight:balance-update"));
      }
      dispatchAuthChange();
      if (onSuccess) onSuccess(res);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.errorMessage
          : "Không thể nhận thưởng lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCloseAttempt = () => {
    if (claimedResult) {
      onClose();
      return;
    }
    if (!isCompleted) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const rewardLabel =
    rewardType === "AI_QUOTA"
      ? "+1 Lượt Camera AI"
      : "+30 EXP";

  const progressPercent = Math.min(
    100,
    Math.round(((AD_DURATION_SECONDS - secondsLeft) / AD_DURATION_SECONDS) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-ink-100 flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 bg-ink-50/70">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              {t("Quảng cáo có thưởng", "Rewarded Ad")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!claimedResult && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {rewardLabel}
              </span>
            )}

            <button
              onClick={handleCloseAttempt}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition"
              aria-label="Đóng"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Ad Video / Display Container */}
        <div className="relative aspect-video w-full bg-slate-900 flex flex-col items-center justify-center text-white overflow-hidden select-none">
          {/* External AdSense Slot Hook / Fallback Animated Video Simulation */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950">
            {/* Visual ad simulation with nice graphics */}
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 shadow-xl shadow-brand-500/30">
              <span className="text-3xl">🤟</span>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600 shadow">
                AI
              </div>
            </div>

            <div className="space-y-1 max-w-sm">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                Signlight Sponsor Spotlight
              </span>
              <h4 className="text-lg font-bold text-white">
                Học Ngôn Ngữ Ký Hiệu Chuẩn Việt Nam
              </h4>
              <p className="text-xs text-ink-300">
                Kết nối yêu thương - Học cùng công nghệ thị giác máy tính AI nhận diện chuyển động tay tức thì.
              </p>
            </div>

            {/* Countdown Badge overlay */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white flex items-center gap-1.5 border border-white/10">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              {secondsLeft > 0 ? (
                <span>{secondsLeft}s {t("còn lại", "left")}</span>
              ) : (
                <span className="text-emerald-400 font-semibold">✓ {t("Hoàn tất", "Completed")}</span>
              )}
            </div>

            <div className="absolute top-3 right-3 text-[10px] text-ink-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
              Ad Network Partner
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-brand-500 transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Body & Action */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {claimedResult ? (
            <div className="text-center py-3 space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink-900">
                  {t("Chúc mừng bạn!", "Congratulations!")}
                </h3>
                <p className="text-sm text-ink-600 mt-1">
                  {claimedResult.message || `Bạn đã nhận được ${rewardLabel}!`}
                </p>
                {claimedResult.newAiBonusQuota > 0 && (
                  <p className="text-xs font-semibold text-brand-600 mt-1">
                    Số lượt AI bonus hiện có: {claimedResult.newAiBonusQuota}
                  </p>
                )}
                {claimedResult.newExpBalance > 0 && (
                  <p className="text-xs font-semibold text-amber-600 mt-1">
                    Tổng EXP hiện tại: {claimedResult.newExpBalance.toLocaleString("vi-VN")} EXP
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="btn btn-primary w-full py-2.5 mt-2"
              >
                {t("Tuyệt vời, tiếp tục!", "Awesome, Continue!")}
              </button>
            </div>
          ) : isCompleted ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
                <span className="text-2xl">🎉</span>
                <div className="text-sm">
                  <p className="font-bold text-emerald-900">
                    {t("Đã xem xong quảng cáo!", "Finished watching ad!")}
                  </p>
                  <p className="text-emerald-700 text-xs mt-0.5">
                    {t("Bấm nút bên dưới để nhận phần thưởng vào tài khoản của bạn.", "Click below to claim your reward.")}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="btn btn-primary w-full py-3 text-base shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                {isClaiming ? (
                  <span>{t("Đang nhận quà...", "Claiming reward...")}</span>
                ) : (
                  <>
                    <span>🎁</span>
                    <span>{t("Nhận ngay", "Claim now")} {rewardLabel}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>{t("Đang xem quảng cáo tài trợ...", "Watching sponsored ad...")}</span>
                <span className="font-mono font-bold text-ink-800">{secondsLeft}s</span>
              </div>
              <p className="text-xs text-ink-400">
                {t(
                  "Xem hết 15 giây quảng cáo tài trợ để ủng hộ SignLight và nhận lượt sử dụng miễn phí.",
                  "Watch all 15 seconds to support SignLight and receive your free reward."
                )}
              </p>
            </div>
          )}
        </div>

        {/* Exit confirmation modal overlay */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center animate-in fade-in">
            <div className="max-w-xs space-y-3 bg-white p-5 rounded-2xl shadow-xl text-ink-900">
              <span className="text-3xl">⚠️</span>
              <h4 className="font-bold text-base">
                {t("Bạn chưa hoàn thành!", "Not finished yet!")}
              </h4>
              <p className="text-xs text-ink-600">
                {t(
                  "Nếu thoát bây giờ, bạn sẽ không nhận được phần thưởng. Bạn có chắc muốn đóng?",
                  "If you leave now, you won't receive the reward. Are you sure you want to close?"
                )}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="btn btn-primary flex-1 py-2 text-xs"
                >
                  {t("Xem tiếp", "Keep Watching")}
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="btn btn-secondary flex-1 py-2 text-xs text-red-600 hover:bg-red-50"
                >
                  {t("Thoát", "Exit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
