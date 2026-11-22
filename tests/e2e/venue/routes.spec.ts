import { expect, test } from "@playwright/test";
import { apiLogin, authenticateOwner, expectRoutablePage, expectUsableLinksAndAssets } from "../helpers";

const email = process.env.EVENTY_OWNER_EMAIL ?? "owner-test@eventy.com";
const password = process.env.EVENTY_OWNER_PASSWORD ?? "OwnerTest123!";

const protectedRoutes = [
  "/dashboard",
  "/dashboard/account",
  "/dashboard/venues",
  "/dashboard/venues/new",
  "/dashboard/availability",
  "/dashboard/statistics",
  "/dashboard/ads-creator",
  "/dashboard/team",
  "/dashboard/bookings",
];

test("all owner dashboard routes render instead of the not-found page", async ({ page }) => {
  await authenticateOwner(page, email, password);

  for (const route of protectedRoutes) {
    await expectRoutablePage(page, route);
  }
});

test("venue pages expose usable internal links and local assets", async ({ page, request }) => {
  await expectUsableLinksAndAssets(page, request, "/login", false);

  await authenticateOwner(page, email, password);
  await expectUsableLinksAndAssets(page, request, "/dashboard/venues");
});

test("venue and booking detail routes that need real ids return a rendered page", async ({ page }) => {
  const backendUrl = process.env.EVENTY_BACKEND_URL ?? "http://127.0.0.1:8080";
  const auth = await apiLogin(email, password);
  const headers = { Authorization: `Bearer ${auth.token}` };
  const [venuesResponse, bookingsResponse] = await Promise.all([
    page.request.get(`${backendUrl}/api/v1/venues`, { headers }),
    page.request.get(`${backendUrl}/api/v1/bookings`, { headers }),
  ]);
  expect(venuesResponse.ok()).toBe(true);
  expect(bookingsResponse.ok()).toBe(true);

  const venues = await venuesResponse.json();
  const bookings = await bookingsResponse.json();
  expect(venues.data.length).toBeGreaterThan(0);
  expect(bookings.data.length).toBeGreaterThan(0);

  await authenticateOwner(page, email, password);
  await expectRoutablePage(page, `/dashboard/venues/${venues.data[0].id}`);
  await expectRoutablePage(page, `/dashboard/bookings/${bookings.data[0].id}`);
});
