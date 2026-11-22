import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
  type NotificationsResponse,
} from "@/lib/api";
import { applyNotificationRead, notificationsQueryKey, readNotification } from "@/lib/notificationsCache";

function jsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

function apiPath(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "");
}

const notification = (id: number, isRead = false): Notification => ({
  id,
  type_code: "booking_confirmed",
  title: "Booking confirmed",
  message: "Your booking is confirmed.",
  booking_id: 42,
  read_at: isRead ? "2026-01-01T00:00:00.000Z" : null,
  is_read: isRead,
  created_at: "2026-01-01T00:00:00.000Z",
});

describe("user notification API", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches notifications with the auth header and normalizes the response", async () => {
    localStorage.setItem("eventy_token", "token-123");
    const payload: NotificationsResponse = {
      data: [notification(1), notification(2, true)],
      meta: { unread_count: 1 },
    };
    const fetchMock = vi.fn(async () => jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getNotifications();

    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(apiPath(url)).toBe("/api/v1/notifications");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer token-123");
    expect(new Headers(init.headers).get("Accept")).toBe("application/json");
  });

  it("defaults missing notification payload fields", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({})));

    expect(await getNotifications()).toEqual({ data: [], meta: { unread_count: 0 } });
  });

  it("surfaces backend error messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "Notifications unavailable" }, false, 503)),
    );

    await expect(getNotifications()).rejects.toThrow("Notifications unavailable");
  });

  it("posts to the single and bulk read endpoints", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);

    await markNotificationRead(7);
    await markAllNotificationsRead();

    expect(
      fetchMock.mock.calls.map(([url, init]) => [apiPath(url), (init as RequestInit).method]),
    ).toEqual([
      ["/api/v1/notifications/7/read", "POST"],
      ["/api/v1/notifications/read-all", "POST"],
    ]);
  });
});

describe("user notification cache helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function seededClient(): QueryClient {
    const client = new QueryClient();
    client.setQueryData(notificationsQueryKey, {
      data: [notification(1), notification(2), notification(3, true)],
      meta: { unread_count: 2 },
    } satisfies NotificationsResponse);
    return client;
  }

  it("marks selected notifications read and decrements the unread counter", () => {
    const client = seededClient();

    applyNotificationRead(client, [1, "2", 3]);

    const result = client.getQueryData<NotificationsResponse>(notificationsQueryKey)!;
    expect(result.data[0].is_read).toBe(true);
    expect(result.data[1].is_read).toBe(true);
    expect(result.data[1].read_at).toBeTruthy();
    expect(result.data[2]).toMatchObject({ is_read: true, read_at: "2026-01-01T00:00:00.000Z" });
    expect(result.meta.unread_count).toBe(0);
  });

  it("does not double-count notifications that were already read", () => {
    const client = seededClient();

    applyNotificationRead(client, [3]);

    const result = client.getQueryData<NotificationsResponse>(notificationsQueryKey)!;
    expect(result.meta.unread_count).toBe(2);
  });

  it("reads a notification remotely and invalidates the cached list", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = seededClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await readNotification(client, 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsQueryKey });
    expect(
      client.getQueryData<NotificationsResponse>(notificationsQueryKey)!.data[0].is_read,
    ).toBe(true);
  });
});
