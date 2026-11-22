import { expect, type APIRequestContext, type Page } from "@playwright/test";

const backendUrl = (process.env.EVENTY_BACKEND_URL ?? "http://127.0.0.1:8080").replace(/\/+$/, "");

interface AuthPayload {
  token: string;
  user: Record<string, unknown>;
}

const authCache = new Map<string, AuthPayload>();

export function isApiPath(response: { url(): string }, path: string): boolean {
  return new URL(response.url()).pathname === path;
}

export async function apiLogin(email: string, password: string): Promise<AuthPayload> {
  const cached = authCache.get(email);
  if (cached) return cached;

  const response = await fetch(`${backendUrl}/api/v1/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(response.ok, `${email} API login should succeed`).toBe(true);

  const payload = (await response.json()) as AuthPayload;
  expect(typeof payload.token).toBe("string");
  expect(payload.user).toBeTruthy();
  authCache.set(email, payload);
  return payload;
}

export async function authenticateUser(page: Page, email: string, password: string): Promise<void> {
  const auth = await apiLogin(email, password);
  await page.addInitScript((payload) => {
    localStorage.setItem("eventy_token", payload.token);
    localStorage.setItem("eventy_user", JSON.stringify(payload.user));
  }, auth);
}

export async function authenticateOwner(page: Page, email: string, password: string): Promise<void> {
  const auth = await apiLogin(email, password);
  await page.addInitScript((payload) => {
    localStorage.setItem("venue_auth", JSON.stringify(payload));
  }, auth);
}

export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/$/);
}

export async function loginOwner(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function expectRoutablePage(page: Page, route: string): Promise<void> {
  const response = await page.goto(route);
  expect(response?.ok(), `${route} should return a page response`).toBe(true);
  await expect(page.getByRole("heading", { name: "404", exact: true })).toHaveCount(0);
  await expect(page.getByText("Oops! Page not found", { exact: true })).toHaveCount(0);
}

export async function expectUsableLinksAndAssets(
  page: Page,
  request: APIRequestContext,
  route: string,
  requireLinks = true,
): Promise<void> {
  await page.goto(route);
  if (requireLinks) {
    await page.locator("a[href]").first().waitFor({ state: "attached" });
  }

  const hrefs = await page.locator("a[href]").evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute("href"))
      .filter((href): href is string => typeof href === "string"),
  );

  const invalid = hrefs.filter(
    (href) =>
      href === "" ||
      href === "#" ||
      /^(javascript|data):/i.test(href),
  );
  expect(invalid, "links should use real destinations").toEqual([]);

  const internalRoutes = new Set(
    hrefs
      .filter((href) => href.startsWith("/"))
      .map((href) => href.split(/[?#]/)[0])
      .filter(Boolean),
  );
  if (requireLinks) {
    expect(internalRoutes.size, `${route} should expose internal links`).toBeGreaterThan(2);
  }

  for (const internalRoute of internalRoutes) {
    const response = await request.get(internalRoute);
    expect(response.ok(), `${internalRoute} should load`).toBe(true);
  }

  const imageSources = await page.locator("img[src]").evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute("src"))
      .filter((src): src is string => typeof src === "string"),
  );
  const localImages = imageSources.filter((src) => src.startsWith("/")).slice(0, 12);

  for (const src of localImages) {
    const response = await request.get(src);
    expect(response.ok(), `${src} should load`).toBe(true);
  }
}
