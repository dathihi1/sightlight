"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { apiCall, ApiError } from "@/lib/api";
import { IconStar, IconShop } from "@/components/ui/Icons";

interface BackendStoreItem {
  itemKey: string;
  itemType: string;
  title: string;
  description: string;
  costExp: number;
  isOwned: boolean;
}

interface BackendCatalog {
  expBalance: number;
  aiBonusQuota: number;
  freezeCount: number;
  lessonPassCount: number;
  items: BackendStoreItem[];
  ownedBadges: string[];
}

export function RewardStore() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const catalogQuery = useQuery({
    queryKey: ["store-catalog"],
    queryFn: () => apiCall<BackendCatalog>("/api/v1/gamification/store"),
  });

  const redeemMutation = useMutation({
    mutationFn: (itemKey: string) =>
      apiCall<{ newExpBalance: number; message: string }>("/api/v1/gamification/store/redeem", {
        method: "POST",
        body: { itemKey },
      }),
    onSuccess: (data, itemKey) => {
      queryClient.invalidateQueries({ queryKey: ["store-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-summary"] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("signlight:balance-update"));
      }

      const item = catalogQuery.data?.items.find((i) => i.itemKey === itemKey);
      setToastType("success");
      setToastMessage(t(`Đổi thành công: ${item?.title || "vật phẩm"}!`, `Successfully redeemed ${item?.title || "item"}!`));
      setTimeout(() => setToastMessage(null), 3500);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.errorMessage
          : t("Không thể đổi vật phẩm. Vui lòng thử lại.", "Failed to redeem item. Please try again.");

      setToastType("error");
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
    },
  });

  if (catalogQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-ink-600">{t("Đang tải cửa hàng…", "Loading store…")}</p>
      </div>
    );
  }

  if (catalogQuery.isError || !catalogQuery.data) {
    return (
      <div className="p-6 bg-danger-50 border border-danger-200 rounded-xl">
        <p className="text-danger-700">
          {t("Không thể tải cửa hàng. Vui lòng thử lại.", "Failed to load store. Please try again.")}
        </p>
      </div>
    );
  }

  const catalog = catalogQuery.data;
  const expBalance = catalog.expBalance ?? 0;
  const consumables = catalog.items.filter((i) => i.itemType !== "BADGE");
  const badges = catalog.items.filter((i) => i.itemType === "BADGE");

  const handleRedeem = (itemKey: string) => {
    redeemMutation.mutate(itemKey);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastType === "success"
              ? "bg-brand-500 border border-brand-600/30"
              : "bg-danger-500 border border-danger-600/30"
          }`}
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXP Balance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-sun-200 bg-gradient-to-r from-sun-50 to-brand-50 p-6 sm:p-8">
        <div>
          <p className="text-sm font-bold text-sun-700 mb-1">
            {t("Số dư EXP thực tế của bạn", "Your Available EXP Balance")}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-4xl sm:text-5xl font-extrabold text-ink-900">{expBalance.toLocaleString()}</p>
            <span className="text-xl font-bold text-sun-600">EXP</span>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {t("Kiếm thêm EXP khi hoàn thành bài học, thực hành camera AI và làm nhiệm vụ mỗi ngày.", "Earn EXP by completing lessons, practicing with AI camera, and finishing quests.")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cua-hang"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <IconShop className="h-4 w-4" />
            <span>{t("Xem Cửa hàng đầy đủ", "Visit Full Store")} &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Consumables Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-ink-900">
          {t("Lượt AI, Vé học & Hỗ trợ học tập", "AI Quota, Passes & Boosters")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consumables.map((item) => (
            <StoreItemCard
              key={item.itemKey}
              item={item}
              onRedeem={handleRedeem}
              isRedeeming={redeemMutation.isPending && redeemMutation.variables === item.itemKey}
              canAfford={expBalance >= item.costExp}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-ink-900">
          {t("Huy hiệu danh dự", "Honor Badges")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((item) => (
            <StoreItemCard
              key={item.itemKey}
              item={item}
              onRedeem={handleRedeem}
              isRedeeming={redeemMutation.isPending && redeemMutation.variables === item.itemKey}
              canAfford={expBalance >= item.costExp}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StoreItemCard({
  item,
  onRedeem,
  isRedeeming,
  canAfford,
  t,
}: {
  item: BackendStoreItem;
  onRedeem: (itemKey: string) => void;
  isRedeeming: boolean;
  canAfford: boolean;
  t: (vi: string, en: string) => string;
}) {
  const getIcon = (key: string) => {
    if (key.startsWith("AI_BONUS")) return "🚀";
    if (key.startsWith("LESSON_UNLOCK")) return "🎫";
    if (key === "STREAK_FREEZE") return "❄️";
    if (key === "EXP_BOOSTER") return "✨";
    if (key === "BADGE_AMBASSADOR") return "👑";
    if (key === "BADGE_PERSISTENCE") return "🔥";
    if (key === "BADGE_COMMUNITY_HERO") return "⚡";
    return "🎁";
  };

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
        item.isOwned
          ? "border-brand-500 bg-brand-50/50"
          : canAfford
            ? "border-ink-200 bg-white hover:border-brand-500 shadow-xs"
            : "border-ink-200 bg-ink-50/60 opacity-70"
      }`}
    >
      {item.isOwned && (
        <div className="absolute -top-2.5 -right-2.5 px-2.5 py-0.5 rounded-full bg-brand-500 text-white flex items-center gap-1 text-xs font-bold shadow-xs">
          ✓ {t("Đã sở hữu", "Owned")}
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-3xl">{getIcon(item.itemKey)}</div>
          <span className="chip bg-sun-100 text-sun-800 font-bold">
            <IconStar className="h-3.5 w-3.5 text-sun-600" />
            {item.costExp} EXP
          </span>
        </div>

        <h4 className="text-sm font-bold text-ink-900 mb-1">{item.title}</h4>
        <p className="text-xs text-ink-600 mb-4 line-clamp-2">{item.description}</p>
      </div>

      <button
        type="button"
        onClick={() => onRedeem(item.itemKey)}
        disabled={item.isOwned || !canAfford || isRedeeming}
        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
          item.isOwned
            ? "bg-brand-100 text-brand-700 cursor-default"
            : canAfford
              ? "bg-brand-500 text-white hover:bg-brand-600 cursor-pointer shadow-xs active:scale-[0.98]"
              : "bg-ink-200 text-ink-500 cursor-not-allowed"
        }`}
      >
        {item.isOwned
          ? t("Đã sở hữu", "Owned")
          : isRedeeming
            ? t("Đang đổi…", "Redeeming…")
            : !canAfford
              ? t(`Thiếu ${item.costExp} EXP`, "Not Enough EXP")
              : t("Đổi ngay", "Redeem")}
      </button>
    </div>
  );
}
