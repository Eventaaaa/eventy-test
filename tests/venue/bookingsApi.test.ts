import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import {
  fetchBookingStats,
  getBooking,
  listBookingYears,
  listBookings,
  mapApiBookingToBooking,
  reviewBooking,
  updateBookingStatus,
} from "@/lib/bookingsApi";
import type { ApiBooking } from "@/types/venue";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

function respond(value: unknown) {
  mockedFetch.mockImplementation(async () => value as never);
}

const booking = (overrides: Partial<ApiBooking> = {}): ApiBooking => ({
  id: 10,
  user_id: 5,
  venue_id: 4,
  booking_date: "2026-05-01",
  period: "full",
  guests_count: 80,
  base_price: "1000",
  extra_guest_price: "50",
  discount_percent: "10",
  discount_amount: "100",
  extras_total: "200",
  total_price: "1100",
  deposit_amount: "550",
  booking_status: "confirmed",
  payment_ref: "REF-1",
  notes: "Anniversary",
  created_at: "2026-04-01",
  payments: [
    {
      id: 1,
      booking_id: 10,
      user_id: 5,
      provider: "stripe",
      method: "card",
      amount: "300",
      currency: "EGP",
      status: "paid",
      provider_txn_id: null,
    },
    {
      id: 2,
      booking_id: 10,
      user_id: 5,
      provider: "stripe",
      method: "cash",
      amount: "400",
      currency: "EGP",
      status: "pending",
      provider_txn_id: null,
    },
  ],
  ...overrides,
});

describe("venue booking API functions", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("lists bookings with the owner token and filters", async () => {
    respond({ data: [booking()], meta: { current_page: 2, last_page: 3, per_page: 15, total: 30 } });

    const result = await listBookings("token", {
      page: 2,
      status: "confirmed",
      venue_id: 4,
      year: 2026,
    });

    expect(result.data).toHaveLength(1);
    const [path, init, token] = mockedFetch.mock.calls[0] as [string, RequestInit, string];
    const [base, query] = path.split("?");
    expect(base).toBe("/bookings");
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      page: "2",
      status: "confirmed",
      venue_id: "4",
      year: "2026",
    });
    expect(init.method).toBe("GET");
    expect(token).toBe("token");
  });

  it("reads the available booking years", async () => {
    respond({ data: [2025, 2026] });

    await expect(listBookingYears("token", { venue_id: 4 })).resolves.toEqual([2025, 2026]);
    expect(mockedFetch).toHaveBeenCalledWith(
      "/bookings/years?venue_id=4",
      { method: "GET" },
      "token",
    );
  });

  it("unwraps a wrapped booking detail response", async () => {
    respond({ data: booking() });

    const result = await getBooking(10, "token");

    expect(result.id).toBe(10);
    expect(mockedFetch).toHaveBeenCalledWith("/bookings/10", { method: "GET" }, "token");
  });

  it("confirms a booking with a PATCH status request", async () => {
    respond({ data: booking({ booking_status: "confirmed" }) });

    const result = await updateBookingStatus("10", "confirmed", "token");

    expect(result?.booking_status).toBe("confirmed");
    expect(mockedFetch).toHaveBeenCalledWith(
      "/bookings/10/status",
      { method: "PATCH", body: JSON.stringify({ status: "confirmed" }) },
      "token",
    );
  });

  it("submits a booking review", async () => {
    respond(undefined);

    await reviewBooking("10", "token");

    expect(mockedFetch).toHaveBeenCalledWith(
      "/bookings/10/review",
      { method: "POST" },
      "token",
    );
  });

  it("serializes stats filters into the expected query parameters", async () => {
    respond({ summary: {} });

    await fetchBookingStats("token", {
      venueId: 4,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      granularity: "month",
      compare: true,
      bookingStatus: ["Confirmed", "Pending"],
      paymentStatus: ["Paid"],
    });

    const path = (mockedFetch.mock.calls[0] as [string])[0];
    const [base, query] = path.split("?");
    expect(base).toBe("/bookings/stats");
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      venue_id: "4",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      granularity: "month",
      compare: "1",
      booking_status: "Confirmed,Pending",
      payment_status: "Paid",
    });
  });
});

describe("mapApiBookingToBooking", () => {
  it("maps backend statuses to display statuses", () => {
    expect(mapApiBookingToBooking(booking(), "Grand Hall").status).toBe("Confirmed");
    expect(
      mapApiBookingToBooking(booking({ booking_status: "pending" }), "Grand Hall").status,
    ).toBe("Pending");
    expect(
      mapApiBookingToBooking(booking({ booking_status: "cancelled" }), "Grand Hall").status,
    ).toBe("Cancelled");
    expect(
      mapApiBookingToBooking(booking({ booking_status: "expired" }), "Grand Hall").status,
    ).toBe("Expired");
    expect(
      mapApiBookingToBooking(
        booking({ booking_status: "unknown" as ApiBooking["booking_status"] }),
        "Grand Hall",
      ).status,
    ).toBe("Pending");
  });

  it("derives payment status from the deposit and totals paid payments", () => {
    const mapped = mapApiBookingToBooking(booking(), "Grand Hall");
    expect(mapped.paymentStatus).toBe("Partial");
    expect(mapped.paidAmount).toBe(300);
    expect(mapped.paymentMethod).toBe("card");
    expect(mapped.clientName).toBe("Client #5");
    expect(mapped.totalPrice).toBe(1100);
    expect(mapped.discountPercent).toBe(10);
    expect(mapped.venueName).toBe("Grand Hall");

    expect(mapApiBookingToBooking(booking({ deposit_amount: "0" }), "Hall").paymentStatus).toBe(
      "Unpaid",
    );
    expect(
      mapApiBookingToBooking(booking({ deposit_amount: "1100" }), "Hall").paymentStatus,
    ).toBe("Paid");
    expect(
      mapApiBookingToBooking(booking({ user_name: "Owner Name", payments: [] }), "Hall").clientName,
    ).toBe("Owner Name");
  });
});
