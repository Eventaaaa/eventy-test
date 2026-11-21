import { describe, expect, it } from "vitest";
import {
  CATERING_MENU_CATEGORIES,
  canonicalCateringMenuCategory,
  formatCateringPrice,
  normalizeCateringCategory,
  parseCateringMenuDraft,
  serializeCateringMenuDraft,
} from "@/lib/catering";
import type { CateringOption } from "@/types/venueResources";

describe("catering menu categories", () => {
  it("uses the canonical ordered list", () => {
    expect(CATERING_MENU_CATEGORIES).toEqual([
      "Main Courses",
      "Appetizers",
      "Salads",
      "Desserts",
      "Beverages",
      "Bread",
    ]);
  });

  it("normalizes existing section titles", () => {
    expect(canonicalCateringMenuCategory("Main Course")).toBe("Main Courses");
    expect(canonicalCateringMenuCategory("Drinks")).toBe("Beverages");
    expect(canonicalCateringMenuCategory("Starters")).toBe("Appetizers");
    expect(canonicalCateringMenuCategory("Unknown")).toBeNull();
  });

  it("round-trips sections with their joiner", () => {
    const sections = [
      { title: "Main Course", items: ["Steak", "Chicken"], joiner: "OR" },
      { title: "Drinks", items: ["Juice"] },
      { title: "Desserts", items: [] },
    ];
    const draft = serializeCateringMenuDraft(sections);
    expect(parseCateringMenuDraft(draft)).toEqual([
      { title: "Main Courses", items: ["Steak", "Chicken"], joiner: "OR" },
      { title: "Beverages", items: ["Juice"] },
    ]);
  });

  it("saves only non-empty categories", () => {
    expect(parseCateringMenuDraft(serializeCateringMenuDraft([]))).toEqual([]);
  });

  it("normalizes option categories", () => {
    expect(normalizeCateringCategory("Standard")).toBe("standard");
    expect(normalizeCateringCategory("Set Menu")).toBe("set_menu");
    expect(normalizeCateringCategory("buffet")).toBe("buffet");
  });
});

describe("catering price formatting", () => {
  const option = (category: string, pricePerPerson: number): CateringOption => ({
    id: 1,
    category,
    title: category,
    price_per_person: pricePerPerson,
    menu: [],
  });

  it("shows standard and priced menus per person", () => {
    expect(formatCateringPrice(option("standard", 100))).toBe("100 EGP / person");
    expect(formatCateringPrice(option("set_menu", 200))).toBe("200 EGP / person");
    expect(formatCateringPrice(option("buffet", 300))).toBe("300 EGP / person");
  });
});
