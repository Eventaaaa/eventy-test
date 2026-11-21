import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BookingStatsResponse } from "@/lib/bookingsApi";
import { StatsCharts } from "@/pages/StatsCharts";

vi.mock("@/hooks/useBookingStats", () => ({
  useBookingStats: () => ({
    data: mockStats,
    isLoading: false,
    isFetching: false,
    isRefetching: false,
  }),
}));

const mockStats: BookingStatsResponse = {
  summary: {
    total: 5,
    confirmedCount: 3,
    pendingCount: 2,
    cancelledCount: 0,
    expiredCount: 0,
    totalRevenue: 30000,
    pendingRevenue: 20000,
    totalGuests: 20,
    avgGuests: 4,
    lostRevenue: 0,
    netRevenue: 30000,
  },
  statusBreakdown: [{ status: "Confirmed", count: 3 }, { status: "Pending", count: 2 }],
  paymentBreakdown: [{ status: "Paid", count: 3 }, { status: "Unpaid", count: 2 }],
  bookingsByMonth: [{ bucket: "2026-03-01", label: "Mar 26", count: 5 }],
  revenueByMonth: [{ bucket: "2026-03-01", label: "Mar 26", revenue: 30000 }],
  periodBreakdown: [{ period: "morning", count: 5 }],
  topVenues: [{ venueId: 1, venueName: "Venue A", bookings: 5, revenue: 30000 }],
  dateRange: { start: "2026-03-01", end: "2026-03-31", granularity: "month" },
  previous: null,
};

const baseProps = {
  globalParams: {},
  granularity: "auto" as const,
  rangeOverrides: {},
  onRangeOverrideChange: vi.fn(),
  statusFilter: [] as string[],
  onStatusFilter: vi.fn(),
  paymentFilter: [] as string[],
  onPaymentFilter: vi.fn(),
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StatsCharts {...baseProps} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  (globalThis as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => {
    cb();
    return 1;
  };
});

describe("StatsCharts fullscreen", () => {
  it("renders all charts without crashing", () => {
    renderPage();
    expect(screen.getByText("Revenue Breakdown")).toBeTruthy();
    expect(screen.getByText("Bookings by Status")).toBeTruthy();
    expect(screen.getByText("Bookings by Period")).toBeTruthy();
    expect(screen.getByText("Bookings & Revenue Over Time")).toBeTruthy();
  });

  it("opens a fullscreen dialog when a chart is clicked", () => {
    renderPage();
    const donut = screen.getByTitle("Expand Bookings by Status");
    fireEvent.click(donut);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Ctrl+scroll to zoom · drag to pan")).toBeTruthy();
  });
});
