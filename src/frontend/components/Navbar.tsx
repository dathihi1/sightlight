"use client";

import { usePathname } from "next/navigation";
import { MarketingNavbar } from "./MarketingNavbar";
import { LearningNavbar } from "./LearningNavbar";
import { useAuthSession } from "@/lib/useAuthSession";

/**
 * Navbar Router:
 * - Khi đã đăng nhập: luôn hiển thị thanh điều hướng chuẩn hoá 8 mục
 *   (Logo, Lộ trình học, Luyện Camera, Từ điển VSL, Gói Premium, Nút chỉnh tiếng, Navbar tài khoản, Thoát).
 * - Khi chưa đăng nhập nhưng vào các trang học tập / từ điển / gói cước: hiển thị LearningNavbar.
 * - Khi chưa đăng nhập ở trang giới thiệu / marketing: hiển thị MarketingNavbar.
 */
export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn, isClient } = useAuthSession();

  const isLearningMode =
    pathname.startsWith("/hoc") ||
    pathname.startsWith("/luyen-ai") ||
    pathname.startsWith("/tu-dien") ||
    pathname.startsWith("/nang-cap") ||
    pathname.startsWith("/thanh-toan") ||
    pathname.startsWith("/hanh-trinh");

  if ((isClient && isLoggedIn) || isLearningMode) {
    return <LearningNavbar />;
  }

  return <MarketingNavbar />;
}
