import { describe, expect, it } from "vitest";
import { buildAdVariations, getHtml2CanvasExportOptions, getPreviewImageFallback, pickAdImageUrl } from "@/components/ads/adCreatorUtils";
import { normalizeMediaUrl } from "@/lib/utils";
import type { ApiVenue } from "@/types/venue";

describe("ad export pipeline", () => {
  it("enables CORS so venue media can be included in the downloaded image", () => {
    const options = getHtml2CanvasExportOptions();

    expect(options.useCORS).toBe(true);
    expect(options.allowTaint).toBe(false);
    expect(options.backgroundColor).toBe("#fff");
  });

  it("normalizes stale localhost and 0.0.0.0 media URLs to the local Vite proxy path", () => {
    expect(normalizeMediaUrl("http://0.0.0.0:8000/venues_assets/Venue1_1.png")).toBe("/venues_assets/Venue1_1.png");
    expect(normalizeMediaUrl("http://localhost:8080/venues_assets/Venue1_1.png")).toBe("/venues_assets/Venue1_1.png");
  });

  it("prefers the selected image source mode for the ad preview", () => {
    const venueImage = "/venues_assets/Venue1_1.png";

    expect(pickAdImageUrl({ media: [{ type: "image", url: venueImage }] } as unknown as ApiVenue, "venue", "")).toBe(venueImage);
    expect(pickAdImageUrl({ media: [{ type: "image", url: venueImage }] } as unknown as ApiVenue, "custom", "https://example.com/other.jpg")).toBe("https://example.com/other.jpg");
    expect(pickAdImageUrl({ media: [{ type: "image", url: venueImage }] } as unknown as ApiVenue, "recommended", "")).toContain("images.unsplash.com");
  });

  it("keeps the selected image source for the preview instead of replacing it with the generic fallback", () => {
    const venueImage = "/venues_assets/Venue1_1.png";
    const venue = { id: 1, media: [{ type: "image", url: venueImage }] } as unknown as ApiVenue;

    expect(getPreviewImageFallback(venue, "venue", "", venueImage)).toBe(venueImage);
    expect(getPreviewImageFallback(venue, "venue", "", "https://images.unsplash.com/fallback.jpg")).not.toContain("images.unsplash.com/photo-1520854221256-17451cc331bf");
  });

  it("creates multiple design variations with different accents for the same message", () => {
    const source = {
      headline: "Luxury weddings, beautifully celebrated",
      description: "Celebrate your big day",
      cta: "Book your special day",
      imageUrl: "https://example.com/venue.jpg",
      accent: "#8b1e3f",
    };

    const variations = buildAdVariations(source, "Hand-Pagac Hall");

    expect(variations).toHaveLength(3);
    expect(new Set(variations.map((item) => item.accent)).size).toBeGreaterThan(1);
  });
});
