"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiCall, tokenStore } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { ErrorNotice } from "@/components/ErrorNotice";
import { IconCheck, IconCrown, IconGift, IconShield, IconSparkles, IconStar, IconChat } from "@/components/ui/Icons";

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

interface AppreciationStatus {
  claimed: boolean;
  planId: string;
  isPremium: boolean;
}

interface RedeemCodeResult {
  code: string;
  title: string;
  description: string;
  expReward: number;
  aiQuota: number;
  premiumDays: number;
  message: string;
}

interface FeedbackResult {
  success: boolean;
  message: string;
}

export default function UpgradePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedPlanId, setSelectedPlanId] = useState<string>("PREMIUM_TRIAN_1M");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái nhập Gift Code
  const [promoCode, setPromoCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<RedeemCodeResult | null>(null);

  // Trạng thái gửi Feedback
  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState("AI_CAMERA");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const isLoggedIn = !!tokenStore.get();

  const plansQuery = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => apiCall<Plan[]>("/api/v1/billing/plans", { auth: false }),
  });

  const appreciationQuery = useQuery({
    queryKey: ["appreciation-status"],
    queryFn: () => apiCall<AppreciationStatus>("/api/v1/billing/appreciation-status"),
    enabled: isLoggedIn,
  });

  const hasClaimedAppreciation = appreciationQuery.data?.claimed ?? false;
  const plans = plansQuery.data ?? [];

  async function handleCheckout(planId: string) {
    setError(null);
    setSubmitting(true);
    try {
      if (!isLoggedIn) {
        router.push(`/dang-nhap?next=${encodeURIComponent("/nang-cap")}`);
        return;
      }

      const result = await apiCall<CheckoutResult>("/api/v1/billing/checkout", {
        method: "POST",
        body: { planId },
      });

      void queryClient.invalidateQueries({ queryKey: ["appreciation-status"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });

      if (result.orderCode) {
        if (result.status === "PAID") {
          router.push(`/thanh-toan/thanh-cong?orderCode=${result.orderCode}`);
        } else {
          router.push(`/thanh-toan?orderCode=${result.orderCode}`);
        }
      } else if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.errorMessage
          : t("Không thể thực hiện yêu cầu. Vui lòng thử lại sau.", "Unable to complete request. Please try again later."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRedeemCode(e: React.FormEvent) {
    e.preventDefault();
    setRedeemError(null);
    setRedeemSuccess(null);

    if (!promoCode.trim()) {
      setRedeemError(t("Vui lòng nhập mã quà tặng.", "Please enter a promo code."));
      return;
    }

    if (!isLoggedIn) {
      router.push(`/dang-nhap?next=${encodeURIComponent("/nang-cap")}`);
      return;
    }

    setRedeemLoading(true);
    try {
      const result = await apiCall<RedeemCodeResult>("/api/v1/billing/redeem-code", {
        method: "POST",
        body: { code: promoCode.trim() },
      });
      setRedeemSuccess(result);
      setPromoCode("");
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["appreciation-status"] });
    } catch (caught) {
      setRedeemError(
        caught instanceof ApiError
          ? caught.errorMessage
          : t("Mã quà tặng không hợp lệ hoặc đã hết lượt.", "Invalid or expired promo code."),
      );
    } finally {
      setRedeemLoading(false);
    }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!feedbackContent.trim()) {
      setFeedbackError(t("Vui lòng nhập nội dung góp ý của bạn.", "Please enter your feedback comments."));
      return;
    }

    setFeedbackLoading(true);
    try {
      const result = await apiCall<FeedbackResult>("/api/v1/billing/feedback", {
        method: "POST",
        body: {
          rating,
          category: feedbackCategory,
          content: feedbackContent.trim(),
        },
      });
      setFeedbackSuccess(result.message);
      setFeedbackContent("");
    } catch (caught) {
      setFeedbackError(
        caught instanceof ApiError
          ? caught.errorMessage
          : t("Không thể gửi phản hồi lúc này. Vui lòng thử lại sau.", "Unable to submit feedback now. Please try again later."),
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  const period = (days: number) =>
    days >= 36500 ? t("trọn đời", "lifetime") : days >= 365 ? t("năm", "year") : days >= 180 ? t("6 tháng", "6 months") : t("tháng", "month");

  const perks = [
    t("Luyện AI qua camera không giới hạn", "Unlimited AI camera practice"),
    t("Không cần xem quảng cáo để nhận thêm lượt AI", "No rewarded ads needed for extra AI attempts"),
    t("Tiến độ học và EXP vẫn được giữ nguyên", "Your learning progress and EXP are preserved"),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <section className="overflow-hidden rounded-[2rem] border border-grape-200 bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-grape-100 text-grape-700">
              <IconCrown className="h-9 w-9" />
            </div>
            <div>
              <p className="eyebrow text-grape-700">{t("Gói thành viên", "Membership")}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {t("SignLight ", "SignLight ")}
                <span className="text-grape-600">Premium</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
                {t(
                  "Cả 17 chủ đề đều miễn phí. Premium mở khóa luyện Camera AI không giới hạn và các đặc quyền tri ân.",
                  "All 17 units are free. Premium unlocks unlimited AI camera practice and appreciation perks.",
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-ink-700 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
            {perks.map((perk) => (
              <div key={perk} className="flex items-start gap-2 rounded-xl bg-grape-50 px-3 py-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-grape-600 text-white">
                  <IconCheck className="h-3 w-3" />
                </span>
                <span className="font-medium leading-5">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {plansQuery.isLoading && (
        <p className="mt-10 text-center text-sm text-ink-600">
          {t("Đang tải bảng giá từ hệ thống…", "Loading current prices…")}
        </p>
      )}

      {plansQuery.isError && (
        <div className="mx-auto max-w-xl">
          <ErrorNotice message={t("Không tải được bảng giá. Vui lòng thử lại sau.", "Unable to load pricing. Please try again later.")} />
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-xl">
          <ErrorNotice message={error} />
        </div>
      )}

      {/* Bảng các gói dịch vụ */}
      {plans.length > 0 && (
        <fieldset className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-grape-700">{t("Bảng giá minh bạch", "Simple pricing")}</p>
              <legend className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
                {t("Chọn gói phù hợp với bạn", "Choose the plan that fits you")}
              </legend>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-600 sm:text-right">
              {t(
                "Thanh toán một lần, không tự động gia hạn. Tiến độ học luôn được giữ nguyên.",
                "One-time payment with no automatic renewal. Your progress is always preserved.",
              )}
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] items-stretch gap-5">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              const isFreeTrial = p.priceVnd === 0 || p.id === "PREMIUM_TRIAN_1M";
              const isPopular = p.id === "PREMIUM_6M";
              const isClaimedFree = isFreeTrial && hasClaimedAppreciation;

              return (
                <article
                  key={p.id}
                  className={`relative flex min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-[var(--shadow-soft)] transition-all sm:p-6 ${
                    isFreeTrial
                      ? isSelected
                        ? "border-success-500 ring-2 ring-success-100"
                        : "border-success-200 hover:border-success-400"
                      : isSelected
                      ? "border-grape-500 ring-2 ring-grape-100"
                      : "border-ink-200 hover:border-grape-300"
                  }`}
                >
                  {isFreeTrial && (
                    <span className="chip absolute -top-3 left-5 whitespace-nowrap bg-success-600 font-bold text-white shadow-sm">
                      🎁 {t("Tri Ân 0đ • 1 Tháng", "Appreciation 0đ • 1 Month")}
                    </span>
                  )}
                  {isPopular && !isFreeTrial && (
                    <span className="chip absolute -top-3 left-5 whitespace-nowrap bg-sun-400 font-bold text-ink-900 shadow-sm">
                      {t("Phổ biến nhất", "Most popular")}
                    </span>
                  )}

                  <label className="flex flex-1 cursor-pointer flex-col pt-2">
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={isSelected}
                      onChange={() => setSelectedPlanId(p.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-ink-900">
                        {p.name.replace("SignLight Premium ", "")}
                      </h2>
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                          isSelected
                            ? isFreeTrial
                              ? "border-success-600 bg-success-600 text-white"
                              : "border-grape-600 bg-grape-600 text-white"
                            : "border-ink-300 bg-white"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <IconCheck className="h-4 w-4" />}
                      </span>
                    </div>

                    <p className="mt-4 flex flex-wrap items-baseline gap-x-1">
                      <span className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                        {p.priceVnd.toLocaleString("vi-VN")}
                      </span>
                      <span className="text-base font-bold text-ink-700">đ</span>
                      <span className="text-sm font-semibold text-ink-500">/ {period(p.durationDays)}</span>
                    </p>

                    <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">{p.description}</p>

                    <ul className="mt-5 space-y-2.5 border-t border-ink-100 pt-5">
                      {perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-sm font-medium leading-5 text-ink-700">
                          <span
                            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${
                              isFreeTrial ? "bg-success-600" : "bg-brand-500"
                            }`}
                          >
                            <IconCheck className="h-2.5 w-2.5" />
                          </span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </label>

                  <button
                    type="button"
                    id={`checkout-btn-${p.id}`}
                    disabled={submitting || isClaimedFree}
                    onClick={() => {
                      if (isClaimedFree) return;
                      setSelectedPlanId(p.id);
                      handleCheckout(p.id);
                    }}
                    className={`btn mt-6 w-full ${
                      isClaimedFree
                        ? "btn-secondary cursor-not-allowed opacity-60"
                        : isFreeTrial
                        ? "bg-success-600 text-white hover:bg-success-700"
                        : "btn-grape"
                    }`}
                  >
                    {isClaimedFree
                      ? t("✓ Đã nhận gói tri ân", "✓ Already claimed")
                      : submitting && isSelected
                      ? t("Đang xử lý…", "Processing…")
                      : isFreeTrial
                      ? t("Nhận gói tri ân 0đ", "Claim 0đ appreciation")
                      : t("Chọn gói này", "Choose plan")}
                  </button>
                </article>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Phần Nhập Code Nhận Thêm Quà */}
      <section className="card border-brand-200 p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <IconGift className="h-6 w-6" />
            </span>
            <div>
              <p className="eyebrow">{t("Nhận thêm quà tặng", "Claim extra gifts")}</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">
              {t("Bạn có mã Gift Code hoặc mã giới thiệu?", "Have a Gift Code or referral code?")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t(
                  "Nhập mã tri ân để nhận thêm lượt luyện Camera AI, điểm EXP hoặc ngày dùng Premium miễn phí.",
                  "Enter an appreciation code to receive AI attempts, EXP rewards, or free Premium days.",
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleRedeemCode} className="min-w-0 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t("Nhập mã (VD: TRIAN2026)", "Enter code (e.g. TRIAN2026)")}
                className="input min-w-0 flex-1 uppercase font-mono font-bold tracking-wider text-ink-900 placeholder:font-sans placeholder:font-normal placeholder:normal-case"
                disabled={redeemLoading}
              />
              <button
                type="submit"
                disabled={redeemLoading || !promoCode.trim()}
                className="btn btn-primary shrink-0 whitespace-nowrap"
              >
                {redeemLoading ? t("Đang kiểm tra…", "Checking…") : t("Nhận quà", "Redeem")}
              </button>
            </div>

            {/* Gợi ý mã code */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-600">
              <span className="font-semibold">{t("Mã gợi ý:", "Suggested codes:")}</span>
              {["TRIAN2026", "FEEDBACK", "SIGNLIGHTVIP"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setPromoCode(sample)}
                  className="rounded-md bg-white border border-brand-200 px-2 py-0.5 font-mono font-bold text-brand-600 hover:bg-brand-50 hover:border-brand-300 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </form>
        </div>

        {redeemError && (
          <div className="mt-4">
            <ErrorNotice message={redeemError} />
          </div>
        )}

        {redeemSuccess && (
          <div className="mt-6 rounded-2xl bg-white p-5 border border-brand-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-brand-600 font-bold text-base">
              <IconSparkles className="h-5 w-5 text-sun-500" />
              <span>{redeemSuccess.title || t("Kích hoạt mã thành công!", "Redeemed successfully!")}</span>
            </div>
            <p className="text-sm text-ink-700">{redeemSuccess.message}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {redeemSuccess.aiQuota > 0 && (
                <span className="chip bg-sky-100 text-sky-800 font-bold">
                  +{redeemSuccess.aiQuota} {t("Lượt AI", "AI turns")}
                </span>
              )}
              {redeemSuccess.expReward > 0 && (
                <span className="chip bg-sun-100 text-sun-800 font-bold">
                  +{redeemSuccess.expReward} EXP
                </span>
              )}
              {redeemSuccess.premiumDays > 0 && (
                <span className="chip bg-grape-100 text-grape-800 font-bold">
                  +{redeemSuccess.premiumDays} {t("Ngày Premium", "Premium days")}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Hòm thư Đóng góp ý kiến & Feedback từ người dùng */}
      <section className="card space-y-6 p-6 sm:p-8">
        <div className="flex items-start gap-4 border-b border-ink-100 pb-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-grape-100 text-grape-700">
            <IconChat className="h-6 w-6" />
          </span>
          <div>
            <p className="eyebrow text-grape-700">{t("Góc tri ân & lắng nghe", "Appreciation & listening")}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
              {t("Góp ý & Feedback của bạn cho SignLight", "Your Feedback for SignLight")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">
              {t(
                "Để gói tri ân 0đ thực sự mang lại giá trị, mọi nhận xét và đề xuất cải tiến của bạn đều là nguồn động lực to lớn cho đội ngũ.",
                "To make the free appreciation plan truly valuable, your feedback helps us improve the learning platform every day.",
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="space-y-5">
          {/* Chọn số sao */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-800">
              {t("Đánh giá độ hài lòng của bạn:", "Your satisfaction rating:")}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 rounded-lg hover:bg-sun-50 transition-colors"
                  aria-label={`${star} sao`}
                >
                  <IconStar
                    className={`h-7 w-7 transition-colors ${
                      star <= rating ? "text-sun-400 fill-sun-400" : "text-ink-200"
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-semibold text-ink-600 ml-2">
                {rating === 5
                  ? t("Tuyệt vời!", "Excellent!")
                  : rating === 4
                  ? t("Rất tốt", "Very good")
                  : rating === 3
                  ? t("Bình thường", "Average")
                  : t("Cần cải thiện", "Needs improvement")}
              </span>
            </div>
          </div>

          {/* Chủ đề góp ý */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-ink-800">
              {t("Chủ đề bạn muốn góp ý:", "Feedback category:")}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "AI_CAMERA", label: t("Nhận diện Camera AI", "Camera AI Recognition") },
                { key: "LESSONS", label: t("Bài học & Ký hiệu VSL", "Lessons & Signs") },
                { key: "PERFORMANCE", label: t("Tốc độ & Giao diện", "UI & Performance") },
                { key: "FEATURE_REQUEST", label: t("Ý tưởng tính năng mới", "Feature Request") },
                { key: "OTHER", label: t("Chủ đề khác", "Other") },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFeedbackCategory(cat.key)}
                  className={`chip cursor-pointer transition-colors ${
                    feedbackCategory === cat.key
                      ? "bg-grape-600 text-white font-bold"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nội dung phản hồi */}
          <div className="space-y-2">
            <label htmlFor="feedback-content" className="text-sm font-bold text-ink-800">
              {t("Nội dung nhận xét / đề xuất chi tiết:", "Detailed comments or suggestions:")}
            </label>
            <textarea
              id="feedback-content"
              rows={4}
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
              placeholder={t(
                "VD: Camera AI nhận diện rất chuẩn, tuy nhiên cần thêm hướng dẫn góc quay tối ưu cho người mới...",
                "e.g. AI camera works great, but I would love more tips on camera placement for beginners...",
              )}
              className="input w-full resize-y font-normal text-sm"
              disabled={feedbackLoading}
            />
          </div>

          {feedbackError && <ErrorNotice message={feedbackError} />}

          {feedbackSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-800">
              <IconCheck className="h-5 w-5 shrink-0 text-success-600" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={feedbackLoading || !feedbackContent.trim()}
              className="btn btn-grape px-6"
            >
              {feedbackLoading ? t("Đang gửi góp ý…", "Submitting…") : t("Gửi góp ý cho SignLight", "Submit feedback")}
            </button>
          </div>
        </form>
      </section>

      {/* Cam kết thanh toán */}
      <div className="card-flat flex flex-col items-start justify-between gap-4 bg-white p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
            <IconShield className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink-900">{t("Thanh toán VietQR qua payOS", "VietQR payment via payOS")}</h2>
            <p className="text-sm text-ink-600">
              {t(
                "Thanh toán một lần cho gói đã chọn, không tự động gia hạn hay trừ tiền lần sau.",
                "One-time payment for the selected plan; no automatic renewal or future charges.",
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
