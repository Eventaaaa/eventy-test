import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { API_BASE, ApiError, apiFetch } from "@/lib/api";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function response(body: string, ok: boolean, status: number): Response {
  return { ok, status, text: async () => body, json: async () => JSON.parse(body) } as Response;
}

describe("venue apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds the bearer token and parses JSON responses", async () => {
    const fetchMock = vi.fn(async () => response('{"data":[]}', true, 200));
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ data: unknown[] }>("/notifications", { method: "GET" }, "token");

    expect(result).toEqual({ data: [] });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE}/notifications`);
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token");
  });

  it("returns undefined for empty successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response("", true, 204)));

    await expect(apiFetch("/bookings/1/review", { method: "POST" }, "token")).resolves.toBeUndefined();
  });

  it("throws ApiError with validation details and reports a toast", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response(
          JSON.stringify({ message: "Invalid booking", errors: { status: ["Required"] } }),
          false,
          422,
        ),
      ),
    );

    const error = await apiFetch("/bookings/1/status", { method: "PATCH" }, "token").catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      message: "Invalid booking",
      errors: { status: ["Required"] },
    });
    expect(toast.error).toHaveBeenCalledWith("Invalid booking", { position: "bottom-left" });
  });
});
