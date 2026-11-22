import { expect, test } from "@playwright/test";
import { isApiPath, loginOwner } from "../helpers";

const email = process.env.EVENTY_OWNER_EMAIL ?? "owner-test@eventy.com";
const password = process.env.EVENTY_OWNER_PASSWORD ?? "OwnerTest123!";

test("redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

test("rejects invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("stores the owner token and reads protected backend data", async ({ page }) => {
  await loginOwner(page, email, password);

  const storedAuth = await page.evaluate(() => localStorage.getItem("venue_auth"));
  expect(storedAuth).toContain(email);

  const venuesResponse = page.waitForResponse(
    (response) => isApiPath(response, "/api/v1/venues") && response.status() === 200,
  );
  await page.goto("/dashboard/venues");

  const response = await venuesResponse;
  const payload = await response.json();
  expect(Array.isArray(payload.data)).toBe(true);
  expect(payload.data.length).toBeGreaterThan(0);
  expect(payload.data[0]).toHaveProperty("id");
  expect(payload.data[0]).toHaveProperty("name");
});
