import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const backendRoot = path.resolve(projectRoot, "..", "eventy-backend");
const manifest = JSON.parse(
  readFileSync(path.join(projectRoot, "tests/contracts/frontend-api-surface.json"), "utf8"),
) as {
  implemented: Array<{ frontend: string; method: string; path: string }>;
  unimplemented: Array<{ frontend: string; method: string; path: string }>;
};

interface BackendRoute {
  method: string;
  uri: string;
}

function normalizePath(value: string): string {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\{[^}]+\}/g, "{}").replace(/\/+/g, "/");
}

function routeKey(route: { method: string; path: string }): string {
  return `${route.method} ${normalizePath(route.path)}`;
}

function backendRoutes(): BackendRoute[] {
  const stdout = execFileSync("php", ["artisan", "route:list", "--json"], {
    cwd: backendRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  return JSON.parse(stdout) as BackendRoute[];
}

const routes = backendRoutes();
const available = new Set<string>();

for (const route of routes) {
  for (const method of route.method.split("|")) {
    available.add(`${method} ${normalizePath(route.uri)}`);
  }
}

describe("frontend API surface", () => {
  it("covers both frontends with a non-empty contract manifest", () => {
    expect(manifest.implemented.length).toBeGreaterThan(0);
    expect(new Set(manifest.implemented.map((item) => item.frontend))).toEqual(
      new Set(["user", "venue"]),
    );
  });

  it.each(manifest.implemented)(
    "has a backend route for $frontend $method $path",
    (contract) => {
      expect(available.has(routeKey(contract))).toBe(true);
    },
  );

  it.each(manifest.unimplemented)(
    "tracks the missing backend route for $frontend $method $path",
    (contract) => {
      expect(available.has(routeKey(contract))).toBe(false);
    },
  );
});
