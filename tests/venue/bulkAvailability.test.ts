import { describe, it, expect } from "vitest";
import {
  bitsToWeekdays,
  excludedMonthsToCalendar,
  withSeconds,
} from "@/lib/bulkAvailability";

describe("bitsToWeekdays", () => {
  it("returns empty array for no days selected", () => {
    expect(bitsToWeekdays(0)).toEqual([]);
  });

  it("maps mon+wed bits to lowercase day strings in canonical order", () => {
    expect(bitsToWeekdays(2 | 8)).toEqual(["mon", "wed"]);
  });

  it("returns all days when full bitset is set", () => {
    expect(bitsToWeekdays(0b11111110)).toEqual([
      "sun",
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
    ]);
  });
});

describe("excludedMonthsToCalendar", () => {
  it("maps JS month index (0-11) to calendar month (1-12)", () => {
    expect(excludedMonthsToCalendar(new Set([0, 11, 5]))).toEqual([1, 6, 12]);
  });

  it("sorts the returned months ascending", () => {
    expect(excludedMonthsToCalendar(new Set([9, 2, 1]))).toEqual([2, 3, 10]);
  });

  it("returns empty array for no exclusions", () => {
    expect(excludedMonthsToCalendar(new Set())).toEqual([]);
  });
});

describe("withSeconds", () => {
  it("appends seconds to an HH:MM time", () => {
    expect(withSeconds("09:00")).toBe("09:00:00");
    expect(withSeconds("23:59")).toBe("23:59:00");
  });
});