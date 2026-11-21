import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
  type NotificationsResponse,
} from "@/lib/notificationsApi";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

const notification: Notification = {
  id: "n-1",
  type_code: "booking_confirmed",
  title: "Booking confirmed",
  message: "Your booking #12 is confirmed.",
  booking_id: 12,
  read_at: null,
  is_read: false,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("venue notifications API", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("requests the notification list with the owner token", async () => {
    const payload: NotificationsResponse = {
      data: [notification],
      meta: { unread_count: 1 },
    };
    mockedFetch.mockResolvedValue(payload);

    await expect(listNotifications("owner-token")).resolves.toBe(payload);
    expect(mockedFetch).toHaveBeenCalledWith("/notifications", { method: "GET" }, "owner-token");
  });

  it("marks one notification as read", async () => {
    mockedFetch.mockResolvedValue(undefined);

    await markNotificationAsRead("n-1", "owner-token");

    expect(mockedFetch).toHaveBeenCalledWith(
      "/notifications/n-1/read",
      { method: "POST" },
      "owner-token",
    );
  });

  it("marks every notification as read", async () => {
    mockedFetch.mockResolvedValue(undefined);

    await markAllNotificationsAsRead("owner-token");

    expect(mockedFetch).toHaveBeenCalledWith(
      "/notifications/read-all",
      { method: "POST" },
      "owner-token",
    );
  });

  it("exposes the notification type code used by the booking status work", () => {
    expect(notification.type_code).toBe("booking_confirmed");
    expect(notification.booking_id).toBe(12);
  });
});
