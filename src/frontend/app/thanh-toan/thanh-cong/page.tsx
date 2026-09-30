"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { apiCall, tokenStore } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

interface CheckoutResult {
  orderCode: number;
  orderRef: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string | null;
  status: string;
}

function SuccessContent() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orderCodeStr = searchParams.get("orderCode");
  const orderCode = orderCodeStr ? parseInt(orderCodeStr, 10) : null;

  const statusQuery = useQuery({
    queryKey: ["payment-status", orderCode],
    queryFn: () => apiCall<CheckoutResult>(`/api/v1/billing/status/${orderCode}`),
    enabled: orderCode !== null && !isNaN(orderCode),
    refetchInterval: (query) => {
      const data = query.state.data;
      return ["PAID", "CANCELLED", "EXPIRED", "FAILED"].includes(data?.status ?? "") ? false : 2000;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const isPaid = statusQuery.data?.status === "PAID";

  useEffect(() => {
    if (!isPaid || !tokenStore.get()) return;
    void queryClient.invalidateQueries({ queryKey: ["me"] });
    void queryClient.invalidateQueries({ queryKey: ["path"] });
  }, [isPaid, queryClient]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
      {isPaid ? (
        <div className="mx-auto w-20 h-20 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-3xl text-brand-500 animate-bounce">
          ✓
        </div>
      ) : (
        <div className="mx-auto w-16 h-16 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      )}

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink-900">
          {isPaid
            ? t("Thanh toán thành công!", "Payment Successful!")
            : t("Đang kiểm tra giao dịch…", "Verifying transaction…")}
        </h1>
        <p className="text-sm text-ink-600">
          {isPaid
            ? t(
                "Tài khoản của bạn đã được nâng cấp thành công lên gói Premium. Toàn bộ 17 Units và tính năng luyện AI không giới hạn đã sẵn sàng!",
                "Your account has been upgraded to Premium. All 17 Units and unlimited AI camera practice are now unlocked!",
              )
            : t(
                "Hệ thống đang đồng bộ giao dịch từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng đợi trong giây lát hoặc quay lại trang thanh toán để quét mã QR.",
                "Synchronizing transaction status with banking network. If you just transferred, please hold on or return to checkout page.",
              )}
        </p>
      </div>

      {statusQuery.data && (
        <div className="card p-5 text-left space-y-2 text-xs text-ink-700">
          <div className="flex justify-between">
            <span className="text-ink-500">{t("Mã đơn hàng:", "Order Code:")}</span>
            <span className="font-semibold text-ink-900">#{statusQuery.data.orderCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("Mã tham chiếu:", "Order Ref:")}</span>
            <span className="font-mono text-ink-900">{statusQuery.data.orderRef}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("Số tiền:", "Amount:")}</span>
            <span className="font-bold text-brand-500">
              {statusQuery.data.amount.toLocaleString("vi-VN")} đ
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">{t("Trạng thái:", "Status:")}</span>
            <span
              className={`font-bold uppercase ${
                isPaid ? "text-brand-500" : "text-sun-500"
              }`}
            >
              {statusQuery.data.status}
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
        {isPaid ? (
          <>
            <Link
              href="/hoc"
              className="btn btn-primary"
            >
              {t("Khám phá 17 Units ngay", "Explore 17 Units now")}
            </Link>
            <Link
              href="/luyen-ai"
              className="btn btn-secondary"
            >
              {t("Luyện Camera AI", "Practice Camera AI")}
            </Link>
          </>
        ) : (
          <>
            {orderCode && (
              <Link
                href={`/thanh-toan?orderCode=${orderCode}`}
                className="btn btn-primary"
              >
                {t("Xem mã QR & Chuyển khoản", "View QR Code & Transfer")}
              </Link>
            )}
            <Link
              href="/nang-cap"
              className="btn btn-secondary"
            >
              {t("Quay lại trang Gói", "Back to Plans")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-ink-600">Đang tải thông tin giao dịch…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
