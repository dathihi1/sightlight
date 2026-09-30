"use client";

import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import Link from "next/link";
import { IconShop, IconCrown } from "@/components/ui/Icons";
import { useAuthSession } from "@/lib/useAuthSession";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface StoreItem {
  itemKey: string;
  itemType: string;
  title: string;
  description: string;
  costExp: number;
  isOwned: boolean;
}

interface StoreCatalog {
  expBalance: number;
  aiBonusQuota: number;
  freezeCount: number;
  lessonPassCount?: number;
  items: StoreItem[];
  ownedBadges: string[];
}

interface RedeemResult {
  itemKey: string;
  itemType: string;
  expDeducted: number;
  newExpBalance: number;
  newAiBonusQuota: number;
  newFreezeCount: number;
  newLessonPassCount?: number;
  message: string;
}

export default function ShopPage() {
  const { isLoggedIn, isClient } = useAuthSession();
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [confirmItem, setConfirmItem] = useState<StoreItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [successResult, setSuccessResult] = useState<RedeemResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiCall<StoreCatalog>("/api/v1/gamification/store");
      if (res) {
        setCatalog(res);
      }
    } catch (err: any) {
      setErrorMsg(err?.errorMessage || "Không thể tải danh mục cửa hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient && isLoggedIn) {
      fetchCatalog();
    } else {
      setLoading(false);
    }
  }, [isClient, isLoggedIn]);

  const handleConfirmRedeem = async () => {
    if (!confirmItem) return;
    setRedeeming(true);
    setErrorMsg(null);

    try {
      const res = await apiCall<RedeemResult>("/api/v1/gamification/store/redeem", {
        method: "POST",
        body: { itemKey: confirmItem.itemKey },
      });

      if (res) {
        setSuccessResult(res);
        setConfirmItem(null);
        trackEvent(AnalyticsEvents.STORE_REDEEM, {
          item_key: confirmItem.itemKey,
          cost_exp: confirmItem.costExp,
          item_type: confirmItem.itemType,
        });
        // Update local catalog stats smoothly
        if (catalog) {
          setCatalog({
            ...catalog,
            expBalance: res.newExpBalance,
            aiBonusQuota: res.newAiBonusQuota,
            freezeCount: res.newFreezeCount,
            lessonPassCount: res.newLessonPassCount ?? catalog.lessonPassCount,
            items: catalog.items.map((it) =>
              it.itemKey === res.itemKey && it.itemType === "BADGE" ? { ...it, isOwned: true } : it
            ),
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.errorMessage || "Không thể đổi vật phẩm này.");
      setConfirmItem(null);
    } finally {
      setRedeeming(false);
    }
  };

  const getItemVisual = (item: StoreItem) => {
    if (item.itemKey.includes("AI_BONUS_10")) return { icon: "🤖✨", bg: "bg-purple-50 text-purple-600 border-purple-200" };
    if (item.itemKey.includes("AI_BONUS")) return { icon: "🤖", bg: "bg-sky-50 text-sky-600 border-sky-200" };
    if (item.itemKey.includes("LESSON_UNLOCK_UNIT")) return { icon: "🗺️", bg: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    if (item.itemKey.includes("LESSON_UNLOCK")) return { icon: "🗝️", bg: "bg-amber-50 text-amber-600 border-amber-200" };
    if (item.itemKey.includes("STREAK")) return { icon: "🧊", bg: "bg-cyan-50 text-cyan-600 border-cyan-200" };
    if (item.itemKey.includes("BOOSTER")) return { icon: "⚡", bg: "bg-yellow-50 text-yellow-600 border-yellow-200" };
    if (item.itemKey.includes("AMBASSADOR")) return { icon: "🎗️", bg: "bg-rose-50 text-rose-600 border-rose-200" };
    if (item.itemKey.includes("PERSISTENCE")) return { icon: "💪", bg: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    return { icon: "🏆", bg: "bg-brand-50 text-brand-600 border-brand-200" };
  };

  const filteredItems = catalog?.items.filter((item) => {
    if (activeCategory === "ALL") return true;
    if (activeCategory === "AI_QUOTA") return item.itemType === "AI_QUOTA" || item.itemKey.includes("AI");
    if (activeCategory === "LESSON_UNLOCK") return item.itemType === "LESSON_PASS" || item.itemKey.includes("LESSON");
    if (activeCategory === "STREAK") return item.itemType === "STREAK" || item.itemType === "BOOSTER" || item.itemKey.includes("FREEZE");
    if (activeCategory === "BADGE") return item.itemType === "BADGE";
    return true;
  }) || [];

  if (!isClient) {
    return <div className="p-16 text-center text-sm text-ink-500 animate-pulse">Đang tải cửa hàng...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-xl p-8 my-12 text-center card">
        <span className="text-4xl block mb-3">🛍️</span>
        <h2 className="text-xl font-bold text-ink-900">Đăng nhập để vào Cửa hàng EXP</h2>
        <p className="text-sm text-ink-600 mt-2">
          Bạn cần đăng nhập để xem số dư điểm kinh nghiệm EXP, đổi lượt sử dụng AI và mở khóa các bài học đặc biệt.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dang-nhap?next=/cua-hang" className="btn btn-primary btn-sm">
            Đăng nhập ngay
          </Link>
          <Link href="/dang-ky" className="btn btn-secondary btn-sm">
            Tạo tài khoản mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
      {/* Hero Header & User Balances */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 w-48 h-48 rounded-full bg-sun-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-xs">
                <IconShop className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-200">Khu đổi thưởng học viên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Cửa Hàng Đổi Thưởng EXP</h1>
            <p className="mt-2 text-sm text-brand-100 leading-relaxed">
              Dùng điểm kinh nghiệm (EXP) bạn tích lũy được sau mỗi bài học để nhận thêm <strong>lượt chấm camera AI</strong>, <strong>vé mở khóa bài học</strong> và các phần thưởng độc quyền!
            </p>
          </div>

          {/* User Balances Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center shrink-0">
            {/* EXP */}
            <div className="p-2.5 rounded-xl bg-white/10">
              <span className="text-xs text-brand-200 block font-medium">Số dư EXP</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg">⭐</span>
                <span className="text-xl sm:text-2xl font-black text-sun-300">
                  {catalog?.expBalance ?? 0}
                </span>
              </div>
            </div>

            {/* AI Quota */}
            <div className="p-2.5 rounded-xl bg-white/10">
              <span className="text-xs text-brand-200 block font-medium">Lượt AI cộng thêm</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg">🤖</span>
                <span className="text-xl sm:text-2xl font-black text-sky-300">
                  {catalog?.aiBonusQuota ?? 0}
                </span>
              </div>
            </div>

            {/* Lesson Passes */}
            <div className="p-2.5 rounded-xl bg-white/10">
              <span className="text-xs text-brand-200 block font-medium">Vé mở bài học</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg">🗝️</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-300">
                  {catalog?.lessonPassCount ?? 0}
                </span>
              </div>
            </div>

            {/* Streak Freeze */}
            <div className="p-2.5 rounded-xl bg-white/10">
              <span className="text-xs text-brand-200 block font-medium">Băng bảo vệ</span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-lg">🧊</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-300">
                  {catalog?.freezeCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-danger-50 text-danger-800 border border-danger-200 text-xs font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-danger-600 hover:text-danger-800 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: "ALL", label: "Tất cả", icon: "✨" },
          { key: "AI_QUOTA", label: "Lượt AI Camera", icon: "🤖" },
          { key: "LESSON_UNLOCK", label: "Mở khóa bài học", icon: "🔓" },
          { key: "STREAK", label: "Bảo vệ Streak & Booster", icon: "⚡" },
          { key: "BADGE", label: "Huy hiệu vinh danh", icon: "🏅" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCategory(tab.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === tab.key
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                : "bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 hover:text-ink-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Catalog Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-ink-100" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-ink-300">
          <span className="text-3xl block mb-2">🎁</span>
          <p className="text-sm font-bold text-ink-700">Không có vật phẩm nào trong mục này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const visual = getItemVisual(item);
            const canAfford = (catalog?.expBalance ?? 0) >= item.costExp;

            return (
              <div
                key={item.itemKey}
                className="card p-5 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon & Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl grid place-items-center text-2xl border ${visual.bg}`}>
                      {visual.icon}
                    </div>

                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-sun-50 border border-sun-200">
                      <span className="text-sm">⭐</span>
                      <span className="text-sm font-bold text-sun-900">{item.costExp} EXP</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-ink-900">{item.title}</h3>
                  <p className="text-xs text-ink-600 mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-5 pt-3 border-t border-ink-100">
                  {item.isOwned ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-ink-100 text-ink-500 font-bold text-xs flex items-center justify-center gap-1 cursor-default"
                    >
                      <span>✓</span> Đã sở hữu
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => setConfirmItem(item)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? "btn-primary shadow-sm hover:scale-[1.01]"
                          : "bg-ink-100 text-ink-400 cursor-not-allowed border border-ink-200"
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <span>Đổi ngay</span>
                          <span className="opacity-80">({item.costExp} EXP)</span>
                        </>
                      ) : (
                        <>
                          <span>Thiếu {item.costExp - (catalog?.expBalance ?? 0)} EXP</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Earn EXP Guide Card */}
      <div className="card p-6 border-brand-200 bg-brand-50/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 grid place-items-center text-2xl shrink-0">
            💡
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-900">Làm thế nào để kiếm thêm EXP?</h4>
            <p className="text-xs text-ink-600 mt-1 leading-relaxed">
              Hoàn thành mỗi bài học để nhận ngay <strong>+20 đến +35 EXP</strong>. Duy trì chuỗi ngày Streak và hoàn thành các nhiệm vụ hàng ngày để tích lũy hàng trăm EXP mỗi tuần!
            </p>
          </div>
        </div>

        <Link href="/hoc" className="btn btn-secondary btn-sm shrink-0 whitespace-nowrap">
          Vào học tích EXP &rarr;
        </Link>
      </div>

      {/* Confirm Redemption Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 grid place-items-center text-3xl bg-brand-50 border border-brand-200">
                {getItemVisual(confirmItem).icon}
              </div>
              <h3 className="text-lg font-bold text-ink-900">Xác nhận đổi vật phẩm</h3>
              <p className="text-xs text-ink-500 mt-1">
                Bạn sắp dùng điểm kinh nghiệm để đổi:
              </p>
              <div className="mt-3 p-3 rounded-xl bg-ink-50 border border-ink-100 text-center">
                <p className="font-bold text-sm text-brand-700">{confirmItem.title}</p>
                <p className="text-xs text-ink-600 mt-0.5">{confirmItem.description}</p>
              </div>

              <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-sun-50 border border-sun-200 text-xs font-semibold">
                <span className="text-ink-700">Chi phí:</span>
                <span className="font-bold text-sun-900">{confirmItem.costExp} EXP</span>
              </div>
              <div className="mt-1 flex items-center justify-between px-4 py-2 text-[11px] text-ink-500">
                <span>Số dư sau khi đổi:</span>
                <span className="font-bold text-ink-800">
                  {(catalog?.expBalance ?? 0) - confirmItem.costExp} EXP
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={redeeming}
                onClick={() => setConfirmItem(null)}
                className="btn btn-secondary btn-sm flex-1 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={redeeming}
                onClick={handleConfirmRedeem}
                className="btn btn-primary btn-sm flex-1 cursor-pointer"
              >
                {redeeming ? "Đang xử lý..." : "Xác nhận đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150">
            <span className="text-5xl block mb-3">🎉</span>
            <h3 className="text-xl font-bold text-ink-900">Đổi thưởng thành công!</h3>
            <p className="text-sm text-brand-600 font-semibold mt-2">{successResult.message}</p>

            <div className="mt-4 p-3 rounded-xl bg-ink-50 border border-ink-100 text-xs text-ink-700 space-y-1 text-left">
              <p>• Số dư EXP còn lại: <strong>{successResult.newExpBalance} EXP</strong></p>
              {successResult.newAiBonusQuota > 0 && (
                <p>• Tổng lượt AI camera khả dụng: <strong>{successResult.newAiBonusQuota} lượt</strong></p>
              )}
              {(successResult.newLessonPassCount ?? 0) > 0 && (
                <p>• Tổng vé mở khóa bài học: <strong>{successResult.newLessonPassCount} vé</strong></p>
              )}
              {successResult.newFreezeCount > 0 && (
                <p>• Băng bảo vệ Streak: <strong>{successResult.newFreezeCount} băng</strong></p>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSuccessResult(null)}
                className="btn btn-secondary btn-sm flex-1 cursor-pointer"
              >
                Tiếp tục mua sắm
              </button>
              {successResult.itemKey.includes("AI") ? (
                <Link href="/luyen-ai" className="btn btn-primary btn-sm flex-1">
                  Luyện AI ngay &rarr;
                </Link>
              ) : (
                <Link href="/hoc" className="btn btn-primary btn-sm flex-1">
                  Vào học ngay &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
