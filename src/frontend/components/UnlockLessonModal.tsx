"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconCrown, IconLock, IconStar } from "@/components/ui/Icons";
import { apiCall } from "@/lib/api";

interface UnlockLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: {
    id: string;
    title: string;
  } | null;
  userExpBalance: number;
  onUnlocked: () => void;
}

interface PayOsResult {
  orderCode: number;
  orderRef: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  description: string;
}

export function UnlockLessonModal({
  isOpen,
  onClose,
  lesson,
  userExpBalance,
  onUnlocked,
}: UnlockLessonModalProps) {
  const [unlockType, setUnlockType] = useState<"RENT_1M" | "PERMANENT">("RENT_1M");
  const [method, setMethod] = useState<"EXP" | "PAYOS">("EXP");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [payOsData, setPayOsData] = useState<PayOsResult | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const costExp = unlockType === "RENT_1M" ? 5000 : 25000;
  const costVnd = unlockType === "RENT_1M" ? 5000 : 25000;
  const hasEnoughExp = userExpBalance >= costExp;

  const handleUnlockWithExp = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await apiCall(`/api/v1/lessons/${lesson.id}/unlock-exp`, {
        method: "POST",
        body: {
          unlockType,
        },
      });

      setSuccessMsg(
        `Chúc mừng bạn đã mở khóa bài học "${lesson.title}" ${
          unlockType === "PERMANENT" ? "vĩnh viễn" : "trong 30 ngày"
        } thành công!`
      );
      window.dispatchEvent(new CustomEvent("signlight:balance-update"));
      setTimeout(() => {
        onUnlocked();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "Không thể mở khóa bài học bằng EXP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockWithPayOs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiCall<PayOsResult>(`/api/v1/lessons/${lesson.id}/unlock-payos`, {
        method: "POST",
        body: {
          unlockType,
        },
      });
      setPayOsData(res);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMsg(e.message || "Không thể tạo liên kết thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-ink-100 p-6 sm:p-8">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200 transition"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-3">
            <IconLock className="h-7 w-7" />
          </span>
          <h2 className="text-xl font-bold text-ink-900">Mở khóa bài học</h2>
          <p className="mt-1 text-sm font-semibold text-brand-600">{lesson.title}</p>
          <p className="mt-1 text-xs text-ink-500">
            Mở khóa để bắt đầu học ngay mà không cần chờ hoàn thành các bài học trước!
          </p>
        </div>

        {successMsg ? (
          <div className="my-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center text-emerald-800">
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold">{successMsg}</p>
          </div>
        ) : payOsData ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-brand-50 p-4 text-center border border-brand-200">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                Quét mã VietQR thanh toán {costVnd.toLocaleString("vi-VN")}đ
              </p>
              {payOsData.qrCode ? (
                <div className="my-3 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={payOsData.qrCode}
                    alt="VietQR Code"
                    className="h-52 w-52 rounded-xl shadow-xs border border-white"
                  />
                </div>
              ) : null}
              <div className="text-xs text-ink-700 space-y-1">
                <p>
                  Ngân hàng: <strong>{payOsData.bankName}</strong>
                </p>
                <p>
                  Số tài khoản: <strong>{payOsData.accountNumber}</strong>
                </p>
                <p>
                  Nội dung CK: <strong className="text-brand-600">{payOsData.description}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={payOsData.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary flex-1 text-sm font-bold"
              >
                Mở cổng PayOS &rarr;
              </a>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("signlight:balance-update"));
                  onUnlocked();
                  onClose();
                }}
                className="btn btn-secondary text-sm font-semibold"
              >
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {errorMsg && (
              <div className="rounded-xl bg-danger-50 border border-danger-200 p-3 text-xs text-danger-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Bước 1: Chọn thời hạn */}
            <div>
              <label className="text-xs font-bold text-ink-700 uppercase tracking-wider block mb-2">
                1. Chọn hình thức mở khóa:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUnlockType("RENT_1M")}
                  className={`relative flex flex-col items-center rounded-2xl p-3.5 border text-center transition ${
                    unlockType === "RENT_1M"
                      ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500 text-brand-900"
                      : "border-ink-200 hover:border-ink-300 text-ink-700 bg-white"
                  }`}
                >
                  <span className="text-sm font-bold">Thuê 30 Ngày</span>
                  <span className="text-xs text-ink-500 mt-1">5.000đ hoặc 5.000 XP</span>
                  {unlockType === "RENT_1M" && (
                    <span className="absolute top-2 right-2 text-brand-600">
                      <IconCheck className="h-4 w-4" />
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUnlockType("PERMANENT")}
                  className={`relative flex flex-col items-center rounded-2xl p-3.5 border text-center transition ${
                    unlockType === "PERMANENT"
                      ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500 text-amber-900"
                      : "border-ink-200 hover:border-ink-300 text-ink-700 bg-white"
                  }`}
                >
                  <span className="inline-block px-1.5 py-0.5 mb-1 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-md">
                    TIẾT KIỆM
                  </span>
                  <span className="text-sm font-bold">Mở Khóa Vĩnh Viễn</span>
                  <span className="text-xs text-ink-500 mt-1">25.000đ hoặc 25.000 XP</span>
                  {unlockType === "PERMANENT" && (
                    <span className="absolute top-2 right-2 text-amber-600">
                      <IconCheck className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Bước 2: Chọn phương thức thanh toán */}
            <div>
              <label className="text-xs font-bold text-ink-700 uppercase tracking-wider block mb-2">
                2. Thanh toán bằng:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("EXP")}
                  className={`flex items-center justify-center gap-2 rounded-2xl p-3 border font-semibold text-sm transition ${
                    method === "EXP"
                      ? "border-sun-500 bg-sun-50 text-sun-900 ring-2 ring-sun-500"
                      : "border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  <IconStar className="h-4 w-4 text-sun-500" />
                  <span>Dùng điểm XP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("PAYOS")}
                  className={`flex items-center justify-center gap-2 rounded-2xl p-3 border font-semibold text-sm transition ${
                    method === "PAYOS"
                      ? "border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500"
                      : "border-ink-200 text-ink-700 hover:bg-ink-50"
                  }`}
                >
                  <span>Chuyển khoản QR</span>
                </button>
              </div>
            </div>

            {/* Chi tiết thanh toán */}
            {method === "EXP" ? (
              <div className="rounded-2xl bg-ink-50 p-4 border border-ink-100">
                <div className="flex justify-between text-xs text-ink-600">
                  <span>Số dư XP hiện có:</span>
                  <span className="font-bold text-ink-900 flex items-center gap-1">
                    <IconStar className="h-3.5 w-3.5 text-sun-500" />
                    {userExpBalance.toLocaleString("vi-VN")} XP
                  </span>
                </div>
                <div className="flex justify-between text-xs text-ink-600 mt-2">
                  <span>Cần thanh toán:</span>
                  <span className="font-bold text-brand-600">{costExp.toLocaleString("vi-VN")} XP</span>
                </div>
                {!hasEnoughExp && (
                  <p className="mt-3 text-xs text-danger-600 font-medium">
                    ⚠️ Bạn còn thiếu {(costExp - userExpBalance).toLocaleString("vi-VN")} XP. Hãy học thêm
                    bài học hoặc chọn chuyển khoản VietQR nhé!
                  </p>
                )}
                <button
                  type="button"
                  disabled={loading || !hasEnoughExp}
                  onClick={handleUnlockWithExp}
                  className="btn btn-primary w-full mt-3 font-bold text-sm"
                >
                  {loading ? "Đang xử lý..." : `Mở khóa bằng ${costExp.toLocaleString("vi-VN")} XP`}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-ink-50 p-4 border border-ink-100">
                <div className="flex justify-between text-xs text-ink-600">
                  <span>Số tiền:</span>
                  <span className="font-bold text-brand-600 text-base">
                    {costVnd.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <p className="text-xs text-ink-500 mt-1">
                  Tạo mã VietQR quét bằng mọi ứng dụng ngân hàng (Vietcombank, MB, Techcombank, Momo, v.v.).
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleUnlockWithPayOs}
                  className="btn btn-primary w-full mt-3 font-bold text-sm"
                >
                  {loading ? "Đang tạo mã QR..." : `Tạo mã QR thanh toán ${costVnd.toLocaleString("vi-VN")}đ`}
                </button>
              </div>
            )}

            {/* Upsell gói Premium */}
            <div className="border-t border-ink-100 pt-4 text-center">
              <Link
                href="/nang-cap"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                <IconCrown className="h-3.5 w-3.5 text-amber-500" />
                Hoặc nâng cấp gói Premium để mở khóa toàn bộ không giới hạn &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
