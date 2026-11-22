import { expect, test } from "@playwright/test";
import { loginUser } from "../helpers";

const email = process.env.EVENTY_INTEGRATION_EMAIL ?? "test-user@eventy.com";
const password = process.env.EVENTY_INTEGRATION_PASSWORD ?? "TestUser123!";

test("stores the backend token and reads the authenticated profile", async ({ page }) => {
  await loginUser(page, email, password);

  const token = await page.evaluate(() => localStorage.getItem("eventy_token"));
  expect(token).toBeTruthy();

  const profileResponse = page.waitForResponse(
    (response) => response.url().includes("/api/v1/profile") && response.status() === 200,
  );
  await page.goto("/account");

  const response = await profileResponse;
  const payload = await response.json();
  expect(payload.data.email).toBe(email);

  const storedUser = await page.evaluate(() => localStorage.getItem("eventy_user"));
  expect(storedUser).toContain(email);
});
