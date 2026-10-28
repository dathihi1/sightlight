import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ShopPage from "./page";
import { apiCall } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

vi.mock("@/lib/api", () => ({ apiCall: vi.fn() }));
vi.mock("@/lib/analytics", () => ({
  AnalyticsEvents: { STORE_REDEEM: "store_redeem" },
  trackEvent: vi.fn(),
}));
vi.mock("@/lib/useAuthSession", () => ({
  useAuthSession: () => ({ isLoggedIn: true, isClient: true }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const catalog = {
  expBalance: 500,
  aiBonusQuota: 2,
  freezeCount: 1,
  lessonPassCount: 0,
  ownedBadges: [],
  items: [
    { itemKey: "AI_BONUS_10", itemType: "AI_QUOTA", title: "10 lượt Camera AI", description: "Thêm lượt luyện", costExp: 100, isOwned: false },
    { itemKey: "BADGE_AMBASSADOR", itemType: "BADGE", title: "Huy hiệu Đại sứ", description: "Huy hiệu danh dự", costExp: 900, isOwned: false },
  ],
};

const redeemResult = {
  itemKey: "AI_BONUS_10",
  itemType: "AI_QUOTA",
  expDeducted: 100,
  newExpBalance: 400,
  newAiBonusQuota: 12,
  newFreezeCount: 1,
  newLessonPassCount: 0,
  message: "Đã cộng 10 lượt Camera AI",
};

describe("ShopPage", () => {
  beforeEach(() => {
    vi.mocked(apiCall).mockImplementation(async (path) => {
      if (path.endsWith("/redeem")) return redeemResult;
      return catalog;
    });
  });

  it("filters catalog and shows insufficient EXP as an explicit disabled state", async () => {
    const user = userEvent.setup();
    render(<ShopPage />);

    await screen.findByText("10 lượt Camera AI");
    await user.click(screen.getByRole("button", { name: /Huy hiệu/ }));

    expect(screen.queryByText("10 lượt Camera AI")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thiếu 400 EXP" })).toBeDisabled();
  });

  it("uses an accessible dialog, prevents duplicate redemption, disables automatic retry, and trusts server balances", async () => {
    let resolveRedeem: ((value: typeof redeemResult) => void) | undefined;
    vi.mocked(apiCall).mockImplementation((path) => {
      if (path.endsWith("/redeem")) {
        return new Promise((resolve) => { resolveRedeem = resolve as (value: typeof redeemResult) => void; });
      }
      return Promise.resolve(catalog);
    });
    const balanceListener = vi.fn();
    window.addEventListener("signlight:balance-update", balanceListener);
    const user = userEvent.setup();
    render(<ShopPage />);

    await screen.findByText("10 lượt Camera AI");
    await user.click(screen.getByRole("button", { name: /Đổi ngay.*100 EXP/ }));
    const dialog = screen.getByRole("dialog", { name: "Xác nhận đổi vật phẩm" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const confirm = screen.getByRole("button", { name: "Xác nhận đổi" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(2));
    expect(apiCall).toHaveBeenLastCalledWith("/api/v1/gamification/store/redeem", {
      method: "POST",
      body: { itemKey: "AI_BONUS_10" },
      retry: false,
    });

    resolveRedeem?.(redeemResult);
    expect(await screen.findByText("400", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("12", { exact: true })).toBeInTheDocument();
    expect(balanceListener).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("store_redeem", expect.objectContaining({ item_key: "AI_BONUS_10" }));
    window.removeEventListener("signlight:balance-update", balanceListener);
  });

  it("closes the confirmation dialog with Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<ShopPage />);
    await screen.findByText("10 lượt Camera AI");
    const redeemButton = screen.getByRole("button", { name: /Đổi ngay.*100 EXP/ });
    redeemButton.focus();
    await user.click(redeemButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(redeemButton).toHaveFocus();
  });
});
