"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ErrorNotice } from "@/components/ErrorNotice";
import { IconCheck, IconCrown, IconShield } from "@/components/ui/Icons";

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
      name: "SignLight Premium Trọn đời",
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

  const period = (days: number) =>
    days >= 36500 ? t("trọn đời", "lifetime") : days >= 365 ? t("năm", "year") : days >= 180 ? t("6 tháng", "6 months") : t("tháng", "month");

  const perks = [
    t("Mở khoá cả 17 chủ đề, 400 ký hiệu", "All 17 units, 400 signs"),
    t("Luyện AI qua camera không giới hạn", "Unlimited AI camera practice"),
    t("Phát video chậm 0.5x & 0.75x", "Slow-motion video 0.5x & 0.75x"),
    t("Huy hiệu Đại sứ", "Ambassador badge"),
    t("Chứng chỉ hoàn thành PDF", "PDF completion certificate"),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-sun-100">
          <IconCrown className="h-12 w-12" />
        </div>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          {t("SignLight ", "SignLight ")}
          <span className="text-grape-600">Premium</span>
        </h1>
        <p className="mt-4 text-lg text-ink-600">
          {t(
            "Mở khoá toàn bộ lộ trình và luyện với AI không giới hạn lượt.",
            "Unlock the full path and practice with AI, no daily limits.",
          )}
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-8 max-w-xl">
          <ErrorNotice message={error} />
        </div>
      )}

      <fieldset className="mt-12">
        <legend className="sr-only">{t("Chọn gói", "Choose a plan")}</legend>
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const isPopular = p.id === "PREMIUM_6M";

            return (
              <label
                key={p.id}
                className={`relative flex cursor-pointer flex-col rounded-3xl border bg-white p-6 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-sky-400 ${
                  isSelected ? "border-grape-400" : "border-ink-200 hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={isSelected}
                  onChange={() => setSelectedPlanId(p.id)}
                  className="sr-only"
                />
                {isPopular && (
                  <span className="chip absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-sun-400 text-ink-900">
                    {t("Phổ biến nhất", "Most popular")}
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-ink-900">{p.name.replace("SignLight Premium ", "")}</h2>
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                      isSelected ? "border-grape-500 bg-grape-500 text-white" : "border-ink-300"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <IconCheck className="h-4 w-4" />}
                  </span>
                </div>

                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-ink-900">{p.priceVnd.toLocaleString("vi-VN")}</span>
                  <span className="text-lg font-bold text-ink-700">đ</span>
                  <span className="text-base font-bold text-ink-500">/ {period(p.durationDays)}</span>
                </p>

                <p className="mt-3 text-base leading-relaxed text-ink-600">{p.description}</p>

                <ul className="mt-5 flex-1 space-y-3 border-t border-ink-100 pt-5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-base font-bold text-ink-700">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-400 text-white">
                        <IconCheck className="h-3 w-3" />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  id={`checkout-btn-${p.id}`}
                  disabled={submitting}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedPlanId(p.id);
                    handleCheckout(p.id);
                  }}
                  className={`btn mt-6 w-full ${isSelected ? "btn-grape" : "btn-secondary"}`}
                >
                  {submitting && isSelected ? t("Đang tạo thanh toán…", "Creating payment…") : t("Chọn gói này", "Choose plan")}
                </button>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="card-flat mt-12 flex flex-col items-center justify-between gap-4 bg-ink-50 p-6 sm:flex-row">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
            <IconShield className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink-900">{t("Thanh toán VietQR qua payOS", "VietQR payment via payOS")}</h2>
            <p className="text-sm text-ink-600">
              {t(
                "Quét mã bằng app ngân hàng bất kỳ, tài khoản được kích hoạt ngay.",
                "Scan with any Vietnamese banking app — activated instantly.",
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-white text-ink-700">payOS</span>
          <span className="chip bg-white text-ink-700">VietQR</span>
        </div>
      </div>
    </div>
  );
}
