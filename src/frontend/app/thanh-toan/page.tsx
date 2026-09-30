"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ApiError, apiCall } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ErrorNotice } from "@/components/ErrorNotice";

interface CheckoutResult {
  orderCode: number;
  orderRef: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string | null;
  status: string;
  accountNumber?: string | null;
  accountName?: string | null;
  bin?: string | null;
  bankName?: string | null;
  description?: string | null;
}

function PaymentContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCodeStr = searchParams.get("orderCode");
  const orderCode = orderCodeStr ? parseInt(orderCodeStr, 10) : null;

  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Tự động chuyển hướng khi trạng thái trong CSDL đổi thành PAID
  useEffect(() => {
    if (statusQuery.data?.status === "PAID" && orderCode) {
      router.push(`/thanh-toan/thanh-cong?orderCode=${orderCode}`);
    }
  }, [statusQuery.data?.status, orderCode, router]);

  async function handleConfirm() {
    if (!orderCode) return;
    setActionError(null);
    setConfirming(true);

    try {
      const result = await apiCall<CheckoutResult>(`/api/v1/billing/confirm/${orderCode}`, {
        method: "POST",
      });

      if (result.status === "PAID") {
        router.push(`/thanh-toan/thanh-cong?orderCode=${orderCode}`);
      } else {
        setActionError(
          t(
            "Cổng payOS chưa ghi nhận thanh toán thành công cho đơn hàng này. Vui lòng quét mã QR chuyển khoản hoặc hoàn tất giao dịch rồi thử lại.",
            "payOS has not confirmed payment for this order yet. Please complete your transfer and try again."
          )
        );
      }
    } catch (caught) {
      setActionError(
        caught instanceof ApiError
          ? caught.errorMessage
          : t("Không thể kiểm tra giao dịch lúc này. Vui lòng thử lại sau.", "Unable to check transaction now. Please try again later.")
      );
    } finally {
      setConfirming(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  if (!orderCode) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-ink-900">
          {t("Không tìm thấy thông tin đơn hàng", "Order information not found")}
        </h1>
        <p className="text-sm text-ink-600">
          {t("Vui lòng chọn lại gói dịch vụ từ trang nâng cấp.", "Please select a plan from the upgrade page.")}
        </p>
        <Link
          href="/nang-cap"
          className="btn btn-primary"
        >
          {t("Quay lại trang Nâng cấp", "Back to Upgrade")}
        </Link>
      </div>
    );
  }

  const tx = statusQuery.data;
  const isExternalCheckout = tx?.checkoutUrl && tx.checkoutUrl.startsWith("http");

  const bankName = tx?.bankName || "BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)";
  const accountName = tx?.accountName || "PHAN BUI BA DAT";
  const accountNumber = tx?.accountNumber || "V3CAS5111146929";
  const transferMemo = tx?.description || tx?.orderRef || "";
  const binCode = tx?.bin || "970418";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-500 text-xs font-bold border border-brand-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            <span>{t("Đơn hàng thanh toán payOS", "payOS Payment Order")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink-900">
            {t("Thanh toán Gói SignLight Premium", "SignLight Premium Checkout")}
          </h1>
          <p className="text-xs sm:text-sm text-ink-600">
            {t("Mã đơn hàng:", "Order code:")} <span className="font-mono font-bold text-ink-900">#{orderCode}</span>
            {tx?.orderRef && (
              <> • {t("Tham chiếu:", "Ref:")} <span className="font-mono font-bold text-ink-900">{tx.orderRef}</span></>
            )}
          </p>
        </div>

        <Link
          href="/nang-cap"
          className="self-start sm:self-auto text-xs font-semibold text-ink-600 hover:text-brand-500 transition-colors"
        >
          ← {t("Chọn gói khác", "Change plan")}
        </Link>
      </div>

      {actionError && <ErrorNotice message={actionError} />}

      {/* Payment Card */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div>
            <div className="text-xs text-ink-600">{t("Số tiền thanh toán:", "Amount to pay:")}</div>
            <div className="text-2xl sm:text-3xl font-bold text-brand-500">
              {tx ? tx.amount.toLocaleString("vi-VN") : "…"} đ
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-600">{t("Cổng thanh toán:", "Payment Gateway:")}</div>
            <div className="font-bold text-ink-900 text-sm">payOS (VietQR)</div>
          </div>
        </div>

        {/* payOS Action Section */}
        {isExternalCheckout ? (
          <div className="space-y-6">
            {/* QR Code & Banking Info Box */}
            <div className="p-5 rounded-2xl bg-ink-50 border border-ink-200 space-y-5">
              <div className="text-center sm:text-left">
                <p className="font-bold text-ink-900 text-base">
                  {t("Quét mã VietQR để thanh toán", "Scan VietQR to pay")}
                </p>
                <p className="text-xs text-ink-600 mt-0.5">
                  {t(
                    "Mở ứng dụng ngân hàng bất kỳ để quét mã QR hoặc chuyển khoản theo thông tin bên dưới.",
                    "Open any mobile banking app to scan the QR code or transfer using details below."
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                {/* QR Container */}
                <div className="card p-3 flex flex-col items-center shrink-0">
                  <img
                    src={
                      tx.qrCode
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                            tx.qrCode
                          )}`
                        : `https://img.vietqr.io/image/${binCode}-${accountNumber}-compact2.jpg?amount=${tx.amount}&addInfo=${encodeURIComponent(
                            transferMemo
                          )}&accountName=${encodeURIComponent(accountName)}`
                    }
                    alt="VietQR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                  <span className="text-xs font-semibold text-brand-500 mt-2 flex items-center gap-1">
                    <span>⚡</span> VietQR • payOS
                  </span>
                </div>

                {/* Transfer Details Table */}
                <div className="w-full space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-ink-200">
                    <span className="text-ink-600">{t("Ngân hàng:", "Bank:")}</span>
                    <span className="font-bold text-ink-900">{bankName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-ink-200">
                    <span className="text-ink-600">{t("Chủ tài khoản:", "Account Name:")}</span>
                    <span className="font-bold text-ink-900">{accountName}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-ink-200">
                    <span className="text-ink-600">{t("Số tài khoản:", "Account Number:")}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-ink-900">{accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(accountNumber, "acc")}
                        className="btn btn-secondary btn-sm cursor-pointer"
                      >
                        {copiedField === "acc" ? "Đã chép" : "Chép"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-ink-200">
                    <span className="text-ink-600">{t("Nội dung CK:", "Transfer Memo:")}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-brand-500">{transferMemo}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transferMemo, "ref")}
                        className="btn btn-secondary btn-sm cursor-pointer"
                      >
                        {copiedField === "ref" ? "Đã chép" : "Chép"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ink-600">{t("Số tiền chính xác:", "Exact Amount:")}</span>
                    <span className="font-semibold text-ink-900 text-sm">
                      {tx.amount.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link to official payOS web checkout */}
            <div className="text-center space-y-2">
              <a
                href={tx.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-center"
              >
                <span>{t("Mở trang thanh toán cổng payOS", "Open payOS Checkout Page")}</span>
                <span>↗</span>
              </a>
              <p className="text-xs text-ink-500">
                {t("Cổng thanh toán bảo mật liên kết trực tiếp với ngân hàng.", "Secure payment gateway connected with banks.")}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200 space-y-2 text-xs text-ink-700">
            <p className="font-semibold text-ink-900">
              {t("Đang khởi tạo liên kết thanh toán payOS…", "Initializing payOS payment link…")}
            </p>
          </div>
        )}

        {/* Polling & Verification */}
        <div className="pt-4 border-t border-ink-100 space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sun-400 animate-pulse" />
              <span>{t("Đang tự động đồng bộ trạng thái từ payOS…", "Syncing status with payOS…")}</span>
            </div>
            <span className="font-mono text-xs text-ink-500">Polling (2s)</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-full border border-brand-500 text-brand-500 hover:bg-brand-50 font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {confirming
                ? t("Đang kiểm tra payOS…", "Checking payOS…")
                : t("Tôi đã thanh toán trên payOS", "I have paid on payOS")}
            </button>

            <Link
              href="/nang-cap"
              className="btn btn-secondary text-center"
            >
              {t("Hủy bỏ", "Cancel")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-sm text-ink-600">Đang tải thông tin thanh toán…</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
