import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  root: projectRoot,
  test: {
    environment: "node",
    include: ["eventy-test/tests/integration/**/*.{test,spec}.{ts,tsx}"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
