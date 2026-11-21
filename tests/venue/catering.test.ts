import { describe, expect, it } from "vitest";
import {
  CATERING_CATEGORY_OPTIONS,
  CATERING_MENU_CATEGORIES,
  MAX_CATERING_MENU_SECTIONS,
  canonicalCateringMenuCategory,
  categoryKey,
  formatCateringMenuSummary,
  formatCateringPrice,
  getCateringMenuLines,
  isCateringMenuSectionVisible,
  isStandardCategory,
  normalizeCateringCategory,
  parseCateringMenuDraft,
  parseCateringMenuEntries,
  serializeCateringMenuDraft,
  serializeCateringMenuEntries,
} from "@/lib/catering";
import type { CateringOption } from "@/types/venueResources";

const option = (pricePerPerson: number | string | null): CateringOption => ({
  id: 1,
  category: "standard",
  title: "Standard",
  price_per_person: pricePerPerson,
  menu: [],
});

describe("venue catering helpers", () => {
  it("formats the per-person price for numeric and string values", () => {
    const formatted = (value: number) => `${value.toLocaleString()} EGP / person`;
    expect(formatCateringPrice(option(150))).toBe(formatted(150));
    expect(formatCateringPrice(option("1250"))).toBe(formatted(1250));
    expect(formatCateringPrice(option(null))).toBe(formatted(0));
  });

  it("recognizes the standard category with surrounding whitespace", () => {
    expect(isStandardCategory(" STANDARD ")).toBe(true);
    expect(isStandardCategory("set_menu")).toBe(false);
    expect(isStandardCategory(null)).toBe(false);
  });

  it("normalizes category values for persistence", () => {
    expect(normalizeCateringCategory(" Set-Menu ")).toBe("set_menu");
    expect(normalizeCateringCategory("Standard")).toBe("standard");
    expect(normalizeCateringCategory("Buffet")).toBe("buffet");
    expect(normalizeCateringCategory(undefined)).toBe("set_menu");
  });

  it("maps section titles to canonical categories", () => {
    expect(categoryKey("Main Course")).toBe("main");
    expect(categoryKey("Drinks")).toBe("drinks");
    expect(categoryKey("Salads")).toBe("salads");
    expect(categoryKey("Appetizers")).toBe("appetizers");
    expect(canonicalCateringMenuCategory("Beverages")).toBe("Beverages");
    expect(canonicalCateringMenuCategory("Noise")).toBeNull();
  });

  it("filters invisible sections and renders joiners", () => {
    expect(isCateringMenuSectionVisible({ title: "None", items: ["x"] })).toBe(false);
    expect(isCateringMenuSectionVisible({ title: " Desserts ", items: ["x"] })).toBe(true);
    expect(
      getCateringMenuLines({ title: "Drinks", items: ["Tea", "Juice"], joiner: " / " }),
    ).toEqual(["- Tea", " / ", "- Juice"]);
    expect(getCateringMenuLines({ title: "Bread", items: [] })).toEqual([
      "- Bread selection included",
    ]);
  });

  it("round-trips menu drafts with deduplicated items and a shared joiner", () => {
    const sections = [
      { title: "Main Course", items: ["Steak", "Chicken", "Steak"], joiner: " OR " },
      { title: "Mains", items: ["Fish"] },
      { title: "Drinks", items: ["Juice"] },
      { title: "None", items: ["Ignored"] },
    ];

    const draft = serializeCateringMenuDraft(sections);
    expect(parseCateringMenuDraft(draft)).toEqual([
      { title: "Main Courses", items: ["Steak", "Chicken", "Fish"], joiner: "OR" },
      { title: "Beverages", items: ["Juice"] },
    ]);
  });

  it("parses and serializes category entries without dropping valid categories", () => {
    expect(CATERING_MENU_CATEGORIES).toHaveLength(6);
    expect(CATERING_CATEGORY_OPTIONS.map((entry) => entry.value)).toEqual([
      "standard",
      "set_menu",
      "buffet",
    ]);
    expect(MAX_CATERING_MENU_SECTIONS).toBe(10);

    const entries = parseCateringMenuEntries(
      JSON.stringify([
        { category: "Desserts", items: "Cake", joiner: " & " },
        { category: "Desserts", items: "Ice cream" },
        { category: "Invalid", items: "Skipped" },
      ]),
    );
    expect(entries.find((entry) => entry.category === "Desserts")).toEqual({
      category: "Desserts",
      items: "Cake, Ice cream",
      joiner: "&",
    });
    expect(parseCateringMenuEntries(serializeCateringMenuEntries(entries))).toEqual(entries);
    expect(parseCateringMenuEntries("not json")).toHaveLength(6);
  });

  it("builds a readable menu summary", () => {
    const summary = formatCateringMenuSummary([
      { title: "Main Courses", items: ["Steak", "Chicken"] },
      { title: "Drinks", items: ["Juice"] },
    ]);
    expect(summary).toBe("Main Courses: Steak, Chicken | Beverages: Juice");
  });
});
