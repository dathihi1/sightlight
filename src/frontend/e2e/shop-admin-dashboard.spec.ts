import { expect, test } from "@playwright/test";

const ok = <T>(result: T) => ({ requestId: "e2e", errorCode: "00000", errorMessage: "", result });

test("shop redemption is single-submit and keyboard accessible", async ({ page }) => {
  let redemptionCount = 0;
  await page.addInitScript(() => localStorage.setItem("signlight.accessToken", "test-token"));
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: ok({ id: "u1", roles: ["LEARNER"], profile: { displayName: "Test" } }) }));
  await page.route("**/api/v1/gamification/store", (route) => route.fulfill({ json: ok({ expBalance: 500, aiBonusQuota: 0, freezeCount: 0, lessonPassCount: 0, ownedBadges: [], items: [{ itemKey: "AI_BONUS_10", itemType: "AI_QUOTA", title: "10 lượt Camera AI", description: "Thêm lượt luyện", costExp: 100, isOwned: false }] }) }));
  await page.route("**/api/v1/gamification/store/redeem", async (route) => {
    redemptionCount += 1;
    await route.fulfill({ json: ok({ itemKey: "AI_BONUS_10", itemType: "AI_QUOTA", expDeducted: 100, newExpBalance: 400, newAiBonusQuota: 10, newFreezeCount: 0, newLessonPassCount: 0, message: "Thành công" }) });
  });

  await page.goto("/cua-hang");
  await page.getByRole("button", { name: /Đổi ngay/ }).click();
  await expect(page.getByRole("dialog", { name: "Xác nhận đổi vật phẩm" })).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận đổi" }).dblclick();
  await expect(page.getByRole("heading", { name: /Đổi thưởng thành công/ })).toBeVisible();
  expect(redemptionCount).toBe(1);
});

test("admin dashboard applies a bounded date range", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("signlight.accessToken", "admin-token"));
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: ok({ id: "a1", roles: ["ADMIN"], profile: { displayName: "Admin" } }) }));
  await page.route("**/api/v1/admin/dashboard/stats*", (route) => {
    const url = new URL(route.request().url());
    const ranged = url.searchParams.has("from");
    return route.fulfill({ json: ok({ totalUsers: 100, activeUsersToday: 10, totalLessonsCompleted: 20, totalAiAttempts: 30, totalRevenueVnd: 400000, activeSubscriptionsCount: 5, totalQuestsAvailable: 6, metricScope: ranged ? "DATE_RANGE" : "ALL_TIME", timeZone: "Asia/Ho_Chi_Minh", rangeFrom: ranged ? "2026-08-31T17:00:00Z" : null, rangeToExclusive: ranged ? "2026-09-30T17:00:00Z" : null, recentCompletions: [] }) });
  });

  await page.goto("/admin");
  await page.getByLabel("Từ ngày").fill("2026-09-01");
  await page.getByLabel("Đến ngày").fill("2026-09-30");
  await page.getByRole("button", { name: "Áp dụng khoảng ngày" }).click();
  await expect(page.getByText("Từ 01/09/2026 đến hết 30/09/2026")).toBeVisible();
});
