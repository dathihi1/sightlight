import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";
import { apiCall } from "@/lib/api";

vi.mock("@/lib/api", () => ({ apiCall: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}));

const stats = {
  totalUsers: 100,
  activeUsersToday: 12,
  totalLessonsCompleted: 55,
  totalAiAttempts: 89,
  totalRevenueVnd: 1_250_000,
  activeSubscriptionsCount: 8,
  totalQuestsAvailable: 6,
  metricScope: "ALL_TIME",
  timeZone: "Asia/Ho_Chi_Minh",
  rangeFrom: null,
  rangeToExclusive: null,
  recentCompletions: [],
};

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.mocked(apiCall).mockResolvedValue(stats);
  });

  it("labels all-time event metrics separately from the current subscription snapshot", async () => {
    render(<AdminDashboardPage />);

    expect(await screen.findByText("Tổng từ trước đến nay")).toBeInTheDocument();
    expect(screen.getByText("Đang hiệu lực hiện tại")).toBeInTheDocument();
    expect(screen.getByText("Chỉ tính giao dịch PAID")).toBeInTheDocument();
  });

  it("sends a complete inclusive date selection and displays the returned range label", async () => {
    vi.mocked(apiCall)
      .mockResolvedValueOnce(stats)
      .mockResolvedValueOnce({
        ...stats,
        metricScope: "DATE_RANGE",
        rangeFrom: "2026-08-31T17:00:00Z",
        rangeToExclusive: "2026-09-30T17:00:00Z",
      });
    const user = userEvent.setup();
    render(<AdminDashboardPage />);
    await screen.findByText("Tổng từ trước đến nay");

    await user.type(screen.getByLabelText("Từ ngày"), "2026-09-01");
    await user.type(screen.getByLabelText("Đến ngày"), "2026-09-30");
    await user.click(screen.getByRole("button", { name: "Áp dụng khoảng ngày" }));

    expect(apiCall).toHaveBeenLastCalledWith(
      "/api/v1/admin/dashboard/stats?from=2026-09-01&to=2026-09-30",
    );
    expect(await screen.findByText("Từ 01/09/2026 đến hết 30/09/2026")).toBeInTheDocument();
  });

  it("validates a partial or reversed date range before requesting", async () => {
    const user = userEvent.setup();
    render(<AdminDashboardPage />);
    await screen.findByText("Tổng từ trước đến nay");

    await user.type(screen.getByLabelText("Từ ngày"), "2026-10-03");
    await user.click(screen.getByRole("button", { name: "Áp dụng khoảng ngày" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Chọn đủ cả ngày bắt đầu và ngày kết thúc");
    expect(apiCall).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText("Đến ngày"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Áp dụng khoảng ngày" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Ngày bắt đầu không được sau ngày kết thúc");
    expect(apiCall).toHaveBeenCalledTimes(1);
  });
});
