"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { apiCall, ApiError } from "@/lib/api";
import { StoreCatalogResponse, StoreItem } from "../types";
import { IconStar } from "@/components/ui/Icons";

interface RedeemRequest {
  itemId: string;
}

export function RewardStore() {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const catalogQuery = useQuery({
    queryKey: ["store-catalog"],
    queryFn: () => apiCall<StoreCatalogResponse>("/api/v1/gamification/store"),
  });

  const redeemMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiCall<{ success: boolean }>("/api/v1/gamification/store/redeem", {
        method: "POST",
        body: { itemId },
      }),
    onSuccess: (data, itemId) => {
      queryClient.invalidateQueries({ queryKey: ["store-catalog"] });

      const item = catalogQuery.data?.items.find((i) => i.id === itemId);
      const itemName = lang === "vi" ? item?.nameVi : item?.nameEn;

      setToastType("success");
      setToastMessage(t(`Đã mua ${itemName} thành công!`, `Successfully purchased ${itemName}!`));
      setTimeout(() => setToastMessage(null), 3500);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.errorMessage
          : t("Không thể mua vật phẩm. Vui lòng thử lại.", "Failed to purchase item. Please try again.");

      setToastType("error");
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
    },
  });

  if (catalogQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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
  const consumables = catalog.items.filter((i) => i.type === "CONSUMABLE");
  const badges = catalog.items.filter((i) => i.type === "BADGE");

  const handleRedeem = (itemId: string) => {
    redeemMutation.mutate(itemId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastType === "success"
              ? "bg-brand-400 border border-brand-600/30"
              : "bg-danger-500 border border-danger-600/30"
          }`}
        >
          <svg
            className={`w-5 h-5 shrink-0 ${toastType === "success" ? "text-white" : "text-white"}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            {toastType === "success" ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EXP Balance Header */}
      <div className="rounded-3xl border border-sun-200 bg-sun-50 p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-sun-700 mb-1">
              {t("Số XP hiện có", "Your XP")}
            </p>
            <p className="text-5xl font-bold text-ink-900">{catalog.expBalance.toLocaleString()}</p>
          </div>
          <IconStar className="h-16 w-16" />
        </div>
      </div>

      {/* Consumables Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-ink-900">
          {t("Vật phẩm có thể tiêu dùng", "Consumable Items")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consumables.map((item) => (
            <StoreItemCard
              key={item.id}
              item={item}
              onRedeem={handleRedeem}
              isRedeeming={redeemMutation.isPending && redeemMutation.variables === item.id}
              canAfford={catalog.expBalance >= item.expCost}
              lang={lang}
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
              key={item.id}
              item={item}
              onRedeem={handleRedeem}
              isRedeeming={redeemMutation.isPending && redeemMutation.variables === item.id}
              canAfford={catalog.expBalance >= item.expCost}
              lang={lang}
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
  lang,
  t,
}: {
  item: StoreItem;
  onRedeem: (itemId: string) => void;
  isRedeeming: boolean;
  canAfford: boolean;
  lang: string;
  t: (vi: string, en: string) => string;
}) {
  const itemName = lang === "vi" ? item.nameVi : item.nameEn;
  const itemDesc = lang === "vi" ? item.descriptionVi : item.descriptionEn;

  const iconMap: Record<string, string> = {
    ai_bonus: "🚀",
    streak_freeze: "❄️",
    badge_ambassador: "👑",
    badge_persistence: "🔥",
    badge_hero: "⚡",
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-5 border transition-all ${
        item.owned
          ? "border-brand-500 bg-brand-500/5"
          : canAfford
            ? "border-ink-200 bg-white hover:border-brand-500"
            : "border-ink-300 bg-ink-100/50 opacity-60"
      }`}
    >
      {item.owned && (
        <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-400 text-white flex items-center justify-center text-sm font-bold">
          ✓
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-4xl">{iconMap[item.iconType] || "🎁"}</div>
        <span className="chip bg-sun-100 text-sun-700">
          <IconStar className="h-4 w-4" />
          {item.expCost} XP
        </span>
      </div>

      <h4 className="text-sm font-bold text-ink-900 mb-1">{itemName}</h4>
      <p className="text-xs text-ink-600 mb-4 line-clamp-2">{itemDesc}</p>

      {item.quantity && (
        <p className="text-xs text-brand-500 font-semibold mb-3">
          {t(`Số lượng: ${item.quantity}`, `Quantity: ${item.quantity}`)}
        </p>
      )}

      <button
        onClick={() => onRedeem(item.id)}
        disabled={item.owned || !canAfford || isRedeeming}
        className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
          item.owned
            ? "bg-brand-500 text-white cursor-default"
            : canAfford
              ? "bg-brand-500 text-white hover:bg-brand-600 cursor-pointer"
              : "bg-ink-300 text-ink-400 cursor-not-allowed"
        } disabled:opacity-60`}
      >
        {item.owned
          ? t("Đã sở hữu", "Owned")
          : isRedeeming
            ? t("Đang mua…", "Buying…")
            : !canAfford
              ? t("EXP không đủ", "Not Enough EXP")
              : t("Mua ngay", "Redeem")}
      </button>
    </div>
  );
}
