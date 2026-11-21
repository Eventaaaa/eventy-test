import { describe, expect, it } from "vitest";
import {
  buildQuery,
  cn,
  findFeaturedItem,
  normalizeMediaUrl,
  statusBadgeBgClass,
  statusBadgeClass,
  unwrapData,
} from "@/lib/utils";

describe("venue status badge helpers", () => {
  it("maps booking statuses to text classes case-insensitively", () => {
    expect(statusBadgeClass("Confirmed")).toBe("text-green-700 dark:text-green-400");
    expect(statusBadgeClass("pending")).toBe("text-accent");
    expect(statusBadgeClass("CANCELLED")).toBe("text-destructive");
    expect(statusBadgeClass("Expired")).toBe("text-muted-foreground");
  });

  it("maps booking and payment statuses to badge background classes", () => {
    expect(statusBadgeBgClass("Confirmed")).toBe(
      "bg-green-500/10 text-green-700 dark:text-green-400",
    );
    expect(statusBadgeBgClass("Paid")).toBe("bg-primary text-primary-foreground");
    expect(statusBadgeBgClass("Partial")).toBe("bg-accent text-accent-foreground");
    expect(statusBadgeBgClass("unknown")).toBe("");
  });
});

describe("venue utility helpers", () => {
  it("omits empty query values and serializes booleans", () => {
    expect(buildQuery({ page: 2, status: "confirmed", compare: true, venue_id: undefined })).toBe(
      "?page=2&status=confirmed&compare=true",
    );
    expect(buildQuery({ compare: false, q: "" })).toBe("");
  });

  it("unwraps API envelopes without discarding raw payloads", () => {
    expect(unwrapData({ data: { id: 7 } })).toEqual({ id: 7 });
    expect(unwrapData({ id: 7 })).toEqual({ id: 7 });
    expect(unwrapData(undefined)).toBeUndefined();
  });

  it("normalizes local media URLs and leaves external URLs alone", () => {
    expect(normalizeMediaUrl("/storage/venues/a.png")).toBe("/storage/venues/a.png");
    expect(normalizeMediaUrl("http://127.0.0.1:8000/storage/venues/a.png")).toBe(
      "/storage/venues/a.png",
    );
    expect(normalizeMediaUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(normalizeMediaUrl(null)).toBeUndefined();
  });

  it("finds featured media and merges tailwind classes", () => {
    expect(findFeaturedItem([{ is_featured: false }, { is_featured: true }])).toEqual({
      is_featured: true,
    });
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });
});
