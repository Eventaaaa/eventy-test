import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "user-frontend",
      testDir: "./tests/e2e/user",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.USER_FRONTEND_URL ?? "http://127.0.0.1:4173",
      },
    },
    {
      name: "venue-frontend",
      testDir: "./tests/e2e/venue",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.VENUE_FRONTEND_URL ?? "http://127.0.0.1:4174",
      },
    },
  ],
});
