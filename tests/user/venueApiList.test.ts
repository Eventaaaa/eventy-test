import { afterEach, describe, expect, it, vi } from "vitest";
import { getVenueAvailabilityRecommendations, getVenues } from "@/lib/api";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

describe("venue list payload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not request availability slots from the venue list endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: [],
        meta: { last_page: 1 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getVenues();

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/api/v1/venues?");
    expect(url).toContain("includeMedia=true");
    expect(url).not.toContain("includeAvailabilitySlots");
  });
});

describe("getVenueAvailabilityRecommendations", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the batched endpoint and returns its data", async () => {
    const data = [
      {
        venue_id: 12,
        date: "2026-11-26",
        period: "morning",
        days_diff: 1,
        is_before: false,
      },
    ];
    const fetchMock = vi.fn(async () => jsonResponse({ data }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getVenueAvailabilityRecommendations("2026-11-25", [12, 15], 6)).resolves.toEqual(data);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("/api/v1/venues/availability-recommendations?");
    expect(url).toContain("date=2026-11-25");
    expect(url).toContain("venue_ids=12%2C15");
    expect(url).toContain("limit=6");
  });

  it("skips the request when there are no candidate venues", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getVenueAvailabilityRecommendations("2026-11-25", [], 6)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
