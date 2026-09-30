export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Gửi sự kiện lượt xem trang (Pageview) đến Google Analytics.
 */
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

/**
 * Gửi sự kiện tuỳ chỉnh (Custom Event) đến Google Analytics.
 * @param action Tên sự kiện (vd: 'lesson_complete', 'ai_practice', 'store_redeem')
 * @param params Các tham số chi tiết đi kèm sự kiện
 */
export const trackEvent = (
  action: string,
  params?: Record<string, string | number | boolean | undefined>
) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function" && GA_MEASUREMENT_ID) {
    window.gtag("event", action, params);
  }
};

/**
 * Danh sách tên các sự kiện chuẩn cho SignLight.
 */
export const AnalyticsEvents = {
  // Học tập
  LESSON_START: "lesson_start",
  LESSON_COMPLETE: "lesson_complete",
  // AI Camera
  AI_PRACTICE_START: "ai_practice_start",
  AI_PRACTICE_RESULT: "ai_practice_result",
  // Cửa hàng & Gamification
  STORE_REDEEM: "store_redeem",
  QUEST_CLAIM: "quest_claim",
  // Từ điển
  SIGN_SEARCH: "sign_search",
  // Doanh thu & Chuyển đổi
  PREMIUM_VIEW: "premium_view",
  CHECKOUT_START: "checkout_start",
} as const;
