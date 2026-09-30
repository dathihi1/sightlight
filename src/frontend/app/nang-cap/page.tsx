"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ErrorNotice } from "@/components/ErrorNotice";

interface Plan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  priceVnd: number;
}

interface CheckoutResult {
  orderCode: number;
  orderRef: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string | null;
  status: string;
}

export default function UpgradePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("PREMIUM_6M");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => apiCall<Plan[]>("/api/v1/billing/plans", { auth: false }),
  });

  const plans = plansQuery.data ?? [
    {
      id: "PREMIUM_1M",
      name: "SignLight Premium 1 Tháng",
      description: "Luyện AI không giới hạn, 100% Ad-Free, trình phát chậm 0.5x-0.75x, và huy hiệu Đại sứ Vàng.",
      durationDays: 30,
      priceVnd: 29000,
    },
    {
      id: "PREMIUM_6M",
      name: "SignLight Premium 6 Tháng",
      description: "Tiết kiệm lớn: Luyện tập AI vô hạn, xem video tua chậm, góc quay đa chiều, chứng chỉ hoàn thành, không quảng cáo.",
      durationDays: 180,
      priceVnd: 100000,
    },
    {
      id: "PREMIUM_LIFETIME",
      name: "SignLight Premium Vĩnh Viễn",
      description: "Trọn đời không lo hết hạn: toàn bộ tính năng Premium, luyện AI không giới hạn, 100% Ad-Free, huy hiệu đặc biệt.",
      durationDays: 36500,
      priceVnd: 350000,
    },
  ];

  async function handleCheckout(planId: string) {
    setError(null);
    setSubmitting(true);
    try {
      if (!tokenStore.get()) {
        router.push(`/dang-nhap?next=${encodeURIComponent("/nang-cap")}`);
        return;
      }

      const result = await apiCall<CheckoutResult>("/api/v1/billing/checkout", {
        method: "POST",
        body: { planId },
      });

      if (result.orderCode) {
        router.push(`/thanh-toan?orderCode=${result.orderCode}`);
      } else if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.errorMessage
          : "Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-12">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f7f8] text-[#0d9fa5] text-xs font-bold border border-[#b2e7e9]">
          <span className="w-2 h-2 rounded-full bg-[#0d9fa5] animate-pulse" />
          <span>{t("Nâng cấp trải nghiệm học VSL", "Upgrade your VSL Learning")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
          {t("Mở khoá toàn bộ 17 Units & 400 Ký hiệu VSL", "Unlock all 17 Units & 400 VSL Signs")}
        </h1>
        <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
          {t(
            "Luyện nhận diện cử chỉ động bằng AI thời gian thực không giới hạn lượt. Học chuyên sâu cùng video bài giảng chuẩn hóa.",
            "Unlimited real-time AI gesture practice with no daily quota limits. Comprehensive curriculum with standard VSL videos.",
          )}
        </p>
      </div>

      {error && <ErrorNotice message={error} />}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const isSelected = selectedPlanId === p.id;
          const isPopular = p.id === "PREMIUM_6M";
          const isPremiumDefault = p.id === "PREMIUM_6M";

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all cursor-pointer border ${
                isSelected
                  ? "border-[#0d9fa5] bg-white shadow-xl scale-[1.02] ring-2 ring-[#0d9fa5]/20"
                  : "border-[#E2DBD0] bg-white/70 hover:bg-white hover:border-[#cbd5e1] shadow-xs"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#0d9fa5] text-white text-xs font-bold shadow-md tracking-wider uppercase">
                  {t("Phổ biến nhất", "Most Popular")}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#0F172A]">{p.name}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-[#0d9fa5] bg-[#0d9fa5]" : "border-[#cbd5e1]"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#0F172A]">
                    {p.priceVnd.toLocaleString("vi-VN")}
                  </span>
                  <span className="text-sm font-semibold text-[#64748B]">đ</span>
                  <span className="text-xs text-[#94A3B8]">
                    / {p.durationDays >= 365 ? "năm" : p.durationDays >= 180 ? "6 tháng" : "tháng"}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">{p.description}</p>

                <hr className="border-[#F1ECE4]" />

                <ul className="space-y-2.5 text-xs text-[#334155]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#0d9fa5] font-bold">✓</span>
                    <span>Luyện AI qua camera không giới hạn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0d9fa5] font-bold">✓</span>
                    <span>100% không quảng cáo & tài trợ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0d9fa5] font-bold">✓</span>
                    <span>Phát lại chậm 0.5x &amp; 0.75x</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0d9fa5] font-bold">✓</span>
                    <span>Góc quay đa chiều &amp; huy hiệu Đại sứ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0d9fa5] font-bold">✓</span>
                    <span>Chứng chỉ hoàn thành PDF</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  id={`checkout-btn-${p.id}`}
                  disabled={submitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(p.id);
                  }}
                  className={`w-full py-3 rounded-full text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-[#0d9fa5] text-white hover:bg-[#0a8287] shadow-md hover:scale-[1.01]"
                      : "bg-[#F4EFE6] text-[#0F172A] hover:bg-[#EDE6DA]"
                  } disabled:opacity-60 cursor-pointer`}
                >
                  {submitting && isSelected
                    ? t("Đang khởi tạo thanh toán…", "Creating payment…")
                    : t("Chọn gói này", "Select Plan")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PayOS Trust & Security Details */}
      <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2DBD0] flex items-center justify-center font-extrabold text-[#0d9fa5] text-xl shadow-xs">
              ⚡
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0F172A]">
                {t("Cổng thanh toán tự động VietQR qua payOS", "Instant VietQR payment via payOS")}
              </h4>
              <p className="text-xs text-[#64748B]">
                {t(
                  "Kích hoạt tài khoản ngay tức thì qua quét mã QR chuyển khoản mọi ngân hàng tại Việt Nam.",
                  "Instant activation via VietQR scanning compatible with all Vietnamese banking apps.",
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Bảo mật bởi</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2DBD0] text-xs font-bold text-[#0F172A]">
              payOS
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E2DBD0] text-xs font-bold text-[#0F172A]">
              VietQR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
