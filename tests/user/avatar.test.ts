import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AVATAR_URL,
  getCurrentUser,
  getProfile,
  type ApiUser,
  uploadAvatar,
} from "@/lib/api";

function apiPath(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, "");
}

const baseUser = (): ApiUser => ({
  id: 1,
  name: "Test User",
  email: "user@example.com",
  role: "user",
});

function jsonResponse(payload: unknown): Response {
  return { ok: true, status: 200, json: async () => payload } as Response;
}

function storeUser(overrides: Partial<ApiUser>) {
  localStorage.setItem("eventy_user", JSON.stringify({ ...baseUser(), ...overrides }));
}

describe("avatar URL normalization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("collapses default avatar paths and absolute URLs to the default constant", () => {
    storeUser({ avatar_url: DEFAULT_AVATAR_URL });
    expect(getCurrentUser()?.avatar_url).toBe(DEFAULT_AVATAR_URL);

    storeUser({ avatar_url: "https://cdn.example.com/default-avatar.svg" });
    expect(getCurrentUser()?.avatar_url).toBe(DEFAULT_AVATAR_URL);
  });

  it("falls back from avatar_url to avatar_path", () => {
    storeUser({
      avatar_url: null,
      avatar_path: "avatars/user-1.png",
    });

    expect(getCurrentUser()?.avatar_url).toMatch(/\/storage\/avatars\/user-1\.png$/);
  });

  it("rewrites relative storage and icon paths onto the storage origin", () => {
    storeUser({ avatar_url: "storage/avatars/user-2.png" });
    expect(getCurrentUser()?.avatar_url).toMatch(/\/storage\/avatars\/user-2\.png$/);

    storeUser({ avatar_url: "team-icons/owner.png?q=1" });
    expect(getCurrentUser()?.avatar_url).toMatch(/\/storage\/team-icons\/owner\.png\?q=1$/);
  });

  it("rewrites absolute storage URLs but keeps unrelated external URLs", () => {
    storeUser({ avatar_url: "https://cdn.example.com/storage/avatars/user-3.png?size=64" });
    expect(getCurrentUser()?.avatar_url).toMatch(/\/storage\/avatars\/user-3\.png\?size=64$/);

    storeUser({ avatar_url: "https://cdn.example.com/logo.png" });
    expect(getCurrentUser()?.avatar_url).toBe("https://cdn.example.com/logo.png");
  });

  it("normalizes the profile response before persisting it", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: { ...baseUser(), avatar_path: "avatars/profile.png" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const profile = await getProfile();

    expect(profile.avatar_url).toMatch(/\/storage\/avatars\/profile\.png$/);
    expect(JSON.parse(localStorage.getItem("eventy_user") ?? "{}").avatar_url).toBe(
      profile.avatar_url,
    );
    expect(apiPath(fetchMock.mock.calls[0][0])).toBe("/api/v1/profile");
  });

  it("uploads the profile picture to the backend and stores the returned user", async () => {
    const file = new File(["avatar"], "photo.png", { type: "image/png" });
    const uploadedUser = {
      ...baseUser(),
      avatar_path: "avatars/user-uploaded.png",
      avatar_url: "/storage/avatars/user-uploaded.png",
    };
    const fetchMock = vi.fn(async () =>
      jsonResponse({ message: "Avatar uploaded successfully.", data: uploadedUser }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const authChanged = vi.fn();
    window.addEventListener("auth:changed", authChanged);

    const user = await uploadAvatar(file);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as FormData;

    expect(apiPath(url)).toBe("/api/v1/profile/avatar");
    expect(init.method).toBe("POST");
    expect(body.get("avatar")).toBe(file);
    expect(user.avatar_url).toMatch(/\/storage\/avatars\/user-uploaded\.png$/);
    expect(JSON.parse(localStorage.getItem("eventy_user") ?? "{}").avatar_url).toBe(
      user.avatar_url,
    );
    expect(authChanged).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:changed", authChanged);
  });
});
