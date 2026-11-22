import { expect, test } from "@playwright/test";
import { isApiPath } from "../helpers";

test("loads backend venues and renders links to venue pages", async ({ page }) => {
  const venuesResponse = page.waitForResponse(
    (response) => isApiPath(response, "/api/v1/venues") && response.status() === 200,
  );

  await page.goto("/venues");

  const response = await venuesResponse;
  const payload = await response.json();
  expect(Array.isArray(payload.data)).toBe(true);
  expect(payload.data.length).toBeGreaterThan(0);
  expect(payload.data[0]).toHaveProperty("id");
  expect(payload.data[0]).toHaveProperty("name");

  await expect(page.locator('a[href^="/venue/"]').first()).toBeAttached();
});

test("redirects anonymous users away from protected pages", async ({ page }) => {
  await page.goto("/bookings");

  await expect(page).toHaveURL(/\/auth$/);
});
