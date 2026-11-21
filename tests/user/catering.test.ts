import { describe, expect, it } from "vitest";
import {
  categoryKey,
  findCateringOption,
  formatCateringPrice,
  getCateringDisplayLabel,
  getCateringMenuLines,
  getCateringOptionPrice,
  getCateringOptions,
  getCateringSelection,
  getCateringValue,
  getDefaultCateringValue,
  getStandardCateringOption,
  isCateringMenuSectionVisible,
  isCateringService,
  isDefaultCateringValue,
  noCateringLabel,
  noCateringValue,
  normalizeCateringValue,
  priceLabel,
} from "@/lib/catering";
import type { VenueCateringOption } from "@/lib/api";

const option = (overrides: Partial<VenueCateringOption> = {}): VenueCateringOption => ({
  id: 1,
  category: "set_menu",
  title: "Set menu",
  price_per_person: 150,
  ...overrides,
});

describe("catering option selection", () => {
  const standard = option({ id: 2, category: "standard", title: "Standard" });
  const premium = option({ id: 3, title: "Premium", price_per_person: 320 });
  const options = [standard, premium];

  it("detects catering services case-insensitively", () => {
    expect(isCateringService("In-house Catering")).toBe(true);
    expect(isCateringService("CATERING")).toBe(true);
    expect(isCateringService("Decoration")).toBe(false);
    expect(isCateringService(null)).toBe(false);
  });

  it("normalizes missing option collections", () => {
    expect(getCateringOptions(null)).toEqual([]);
    expect(getCateringOptions(options)).toBe(options);
  });

  it("uses the numeric id as the stable value and falls back to the title", () => {
    expect(getCateringValue(option({ id: 7 }))).toBe("7");
    expect(getCateringValue(option({ id: undefined, title: "Buffet" }))).toBe("Buffet");
  });

  it("labels the standard category without leaking the backend title", () => {
    expect(getCateringDisplayLabel(standard)).toBe("Standard");
    expect(getCateringDisplayLabel(premium)).toBe("Premium");
  });

  it("defaults to the standard option, then the first option, then no catering", () => {
    expect(getStandardCateringOption(options)).toBe(standard);
    expect(getDefaultCateringValue(options)).toBe("2");
    expect(getDefaultCateringValue([premium])).toBe("3");
    expect(getDefaultCateringValue([])).toBe(noCateringValue);
    expect(getDefaultCateringValue(null)).toBe(noCateringValue);
  });

  it("normalizes legacy and empty values to the default selection", () => {
    expect(normalizeCateringValue(options, "standard")).toBe("2");
    expect(normalizeCateringValue(options, "")).toBe("2");
    expect(normalizeCateringValue(options, null)).toBe("2");
    expect(normalizeCateringValue(options, "3")).toBe("3");
    expect(isDefaultCateringValue(options, "2")).toBe(true);
    expect(isDefaultCateringValue(options, "standard")).toBe(true);
    expect(isDefaultCateringValue(options, "3")).toBe(false);
  });

  it("finds options by value and treats the sentinel as no selection", () => {
    expect(findCateringOption(options, "3")).toBe(premium);
    expect(findCateringOption(options, noCateringValue)).toBeNull();
    expect(findCateringOption(options, "missing")).toBeNull();
  });

  it("builds a selection with the resolved title and per-person price", () => {
    expect(getCateringSelection(options, "standard")).toEqual({
      value: "2",
      title: "Standard",
      pricePerPerson: 150,
    });
    expect(getCateringSelection(options, "3")).toEqual({
      value: "3",
      title: "Premium",
      pricePerPerson: 320,
    });
    expect(getCateringSelection(options, null)).toEqual({
      value: "2",
      title: "Standard",
      pricePerPerson: 150,
    });
    expect(getCateringSelection(options, noCateringValue)).toEqual({
      value: noCateringValue,
      title: noCateringLabel,
      pricePerPerson: 0,
    });
    expect(getCateringSelection([], "unknown")).toEqual({
      value: noCateringValue,
      title: noCateringLabel,
      pricePerPerson: 0,
    });
  });
});

describe("catering prices", () => {
  it("prefers price_per_person and falls back to legacy price", () => {
    expect(getCateringOptionPrice(option({ price_per_person: 220, price: 999 }))).toBe(220);
    expect(getCateringOptionPrice(option({ price_per_person: 0, price: 180 }))).toBe(180);
    expect(getCateringOptionPrice(option({ price_per_person: "90", price: null }))).toBe(90);
    expect(getCateringOptionPrice(option({ price_per_person: -5, price: "not-a-number" }))).toBe(0);
    expect(getCateringOptionPrice(null)).toBe(0);
  });

  it("formats per-person labels for numbers and strings", () => {
    const formatted = (value: number) => `${value.toLocaleString()} EGP / person`;
    expect(formatCateringPrice(1000)).toBe(formatted(1000));
    expect(formatCateringPrice(0)).toBe(formatted(0));
    expect(priceLabel(option({ price_per_person: "1250" }))).toBe(formatted(1250));
    expect(priceLabel(null)).toBe(formatted(0));
  });
});

describe("catering menu presentation", () => {
  it("only shows meaningful section titles", () => {
    expect(isCateringMenuSectionVisible({ title: " Main Courses ", items: ["Steak"] })).toBe(true);
    expect(isCateringMenuSectionVisible({ title: " none ", items: ["Steak"] })).toBe(false);
    expect(isCateringMenuSectionVisible({ title: "  ", items: ["Steak"] })).toBe(false);
  });

  it("renders items as lines with the configured joiner", () => {
    const section = { title: "Drinks", items: ["Tea", "Coffee"], joiner: "OR" };
    expect(getCateringMenuLines(section)).toEqual(["- Tea", "OR", "- Coffee"]);
    expect(getCateringMenuLines({ title: "Bread", items: [] })).toEqual([
      "- Bread selection included",
    ]);
  });

  it("maps titles to stable category keys", () => {
    expect(categoryKey("Main Courses")).toBe("main");
    expect(categoryKey("Beverages")).toBe("drinks");
    expect(categoryKey("Dessert Table")).toBe("desserts");
    expect(categoryKey("Starters")).toBe("appetizers");
    expect(categoryKey("Bread Basket")).toBe("bread");
    expect(categoryKey("Mystery")).toBe("mystery");
  });
});
