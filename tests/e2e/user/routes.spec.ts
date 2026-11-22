import { expect, test } from "@playwright/test";
import { apiLogin, authenticateUser, expectRoutablePage, expectUsableLinksAndAssets } from "../helpers";

const email = process.env.EVENTY_INTEGRATION_EMAIL ?? "test-user@eventy.com";
const password = process.env.EVENTY_INTEGRATION_PASSWORD ?? "TestUser123!";

const publicRoutes = [
  "/",
  "/venues",
  "/venue/1",
  "/auth",
  "/about",
  "/help",
  "/terms",
  "/privacy",
  "/payment-success",
  "/contribute/demo",
  "/timeline/demo",
];

const protectedRoutes = [
  "/account",
  "/bookings",
  "/contribution-registry",
  "/day-planner",
];

test("all public user routes render instead of the not-found page", async ({ page }) => {
  for (const route of publicRoutes) {
    await expectRoutablePage(page, route);
  }
});

test("all authenticated user routes render instead of the not-found page", async ({ page }) => {
  await authenticateUser(page, email, password);

  for (const route of protectedRoutes) {
    await expectRoutablePage(page, route);
  }
});

test("user pages expose usable internal links and local assets", async ({ page, request }) => {
  await expectUsableLinksAndAssets(page, request, "/");
  await expectUsableLinksAndAssets(page, request, "/venues");
});

test("booking routes that need a real id return a rendered page", async ({ page }) => {
  const backendUrl = process.env.EVENTY_BACKEND_URL ?? "http://127.0.0.1:8080";
  const auth = await apiLogin(email, password);
  const response = await page.request.get(`${backendUrl}/api/v1/bookings`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(response.ok()).toBe(true);

  await authenticateUser(page, email, password);
  const bookings = await response.json();
  expect(Array.isArray(bookings.data)).toBe(true);
  expect(bookings.data.length).toBeGreaterThan(0);

  await expectRoutablePage(page, `/bookings/${bookings.data[0].id}`);
});
