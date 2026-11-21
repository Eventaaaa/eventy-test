import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseAdCopyResponse,
  parseAdImageResponse,
  parseAdPromptResponse,
  shareFacebookPhoto,
} from "@/lib/adsApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ad copy response parsing", () => {
  it("unwraps the backend data envelope and keeps rendered text fields", () => {
    const result = parseAdCopyResponse({
      data: {
        headline: "Royal Hall",
        description: "A refined wedding venue in Cairo.",
        subheadline: "A refined wedding venue in Cairo.",
        cta: "Book your date",
        image_prompt: "Venue background with no text",
        social_caption: "Your celebration starts here.",
        hashtags: ["#RoyalHall", "#CairoWeddings"],
        phone: "+201000000000",
        offer: "10% offer on 2026-10-01",
        language: "Egyptian Arabic",
        audience: "affluent couples",
        tone: "premium",
        style: "luxury",
        visual_style: "luxury",
        aspect_ratio: "4:5",
        variations: [
          {
            headline: "Royal Hall",
            subheadline: "A refined wedding venue in Cairo.",
            cta: "Book your date",
            variation_label: "Variation 1",
          },
          {
            headline: "Luxury in Cairo",
            subheadline: "Celebrate your wedding at Royal Hall.",
            cta: "Plan your visit",
            variation_label: "Variation 2",
          },
        ],
      },
    });

    expect(result.headline).toBe("Royal Hall");
    expect(result.subheadline).toBe("A refined wedding venue in Cairo.");
    expect(result.cta).toBe("Book your date");
    expect(result.imagePrompt).toBe("Venue background with no text");
    expect(result.socialCaption).toBe("Your celebration starts here.");
    expect(result.hashtags).toEqual(["#RoyalHall", "#CairoWeddings"]);
    expect(result.phone).toBe("+201000000000");
    expect(result.offer).toBe("10% offer on 2026-10-01");
    expect(result.language).toBe("Egyptian Arabic");
    expect(result.style).toBe("luxury");
    expect(result.aspectRatio).toBe("4:5");
    expect(result.variations).toHaveLength(2);
    expect(result.variations[1].cta).toBe("Plan your visit");
  });

  it("rejects incomplete ad copy instead of rendering an empty ad", () => {
    expect(() => parseAdCopyResponse({ data: { headline: "Only a headline" } })).toThrow(
      "The ad service returned an incomplete response.",
    );
  });
});

describe("ad prompt response parsing", () => {
  it("reads the suggestion that fills the textarea", () => {
    const result = parseAdPromptResponse({
      data: {
        venue_id: 3,
        prompt: "Create a luxury wedding ad for affluent couples in Cairo.",
        language: "Egyptian Arabic",
        audience: "affluent couples",
        tone: "premium",
        style: "luxury",
        fallback: false,
      },
    });

    expect(result.venueId).toBe(3);
    expect(result.prompt).toBe("Create a luxury wedding ad for affluent couples in Cairo.");
    expect(result.style).toBe("luxury");
    expect(result.fallback).toBe(false);
  });
});

describe("ad image response parsing", () => {
  it("reads the generated concept image url", () => {
    const result = parseAdImageResponse({
      data: {
        url: "/storage/ad-images/image.png",
        path: "ad-images/image.png",
        model: "gpt-image-1",
        size: "1024x1536",
        aspect_ratio: "4:5",
        provider: "pollinations",
        fallback: true,
      },
    });

    expect(result.url).toBe("/storage/ad-images/image.png");
    expect(result.path).toBe("ad-images/image.png");
    expect(result.aspectRatio).toBe("4:5");
    expect(result.provider).toBe("pollinations");
    expect(result.fallback).toBe(true);
  });
});

describe("Facebook photo sharing", () => {
  it("uploads the rendered image to the backend Facebook endpoint", async () => {
    const fetchMock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ photoId: "123", url: "https://www.facebook.com/photo.php?fbid=123", pageId: "456" }),
    } as Response));
    vi.stubGlobal("fetch", fetchMock);

    const result = await shareFacebookPhoto(new Blob(["png"], { type: "image/png" }), "Caption", 7, "token");

    expect(result).toEqual({
      photoId: "123",
      url: "https://www.facebook.com/photo.php?fbid=123",
      pageId: "456",
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/venues/7/facebook/photos");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer token");
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("exposes the backend status when Facebook sharing is not configured", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: false,
      status: 503,
      json: async () => ({ message: "Facebook page sharing is not configured." }),
    } as Response)));

    await expect(shareFacebookPhoto(new Blob(["png"], { type: "image/png" }), "Caption", 7)).rejects.toMatchObject({ status: 503 });
  });
});
