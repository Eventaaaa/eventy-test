import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const venueSrc = fileURLToPath(new URL("../eventy-venue-frontend/src/", import.meta.url));

export default defineConfig({
  root: projectRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": venueSrc,
      sonner: fileURLToPath(new URL("./node_modules/sonner/dist/index.mjs", import.meta.url)),
      "@vitest/coverage-v8": fileURLToPath(
        new URL("./node_modules/@vitest/coverage-v8/dist/index.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [fileURLToPath(new URL("./tests/setup.ts", import.meta.url))],
    include: ["eventy-test/tests/venue/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      all: true,
      include: ["eventy-venue-frontend/src/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts", "**/*.test.*", "**/*.spec.*", "**/test/**"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: fileURLToPath(new URL("./coverage/venue", import.meta.url)),
    },
  },
});
