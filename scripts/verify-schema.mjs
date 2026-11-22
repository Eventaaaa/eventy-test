import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const backendRoot = path.resolve(root, "..", "eventy-backend");
const expected = JSON.parse(
  readFileSync(path.join(root, "tests/contracts/schema.json"), "utf8"),
);

function backendEnvironment() {
  const env = { ...process.env };
  const overrides = {
    EVENTY_DB_CONNECTION: "DB_CONNECTION",
    EVENTY_DB_HOST: "DB_HOST",
    EVENTY_DB_PORT: "DB_PORT",
    EVENTY_DB_DATABASE: "DB_DATABASE",
    EVENTY_DB_NAME: "DB_DATABASE",
    EVENTY_DB_USERNAME: "DB_USERNAME",
    EVENTY_DB_PASSWORD: "DB_PASSWORD",
  };

  for (const [source, target] of Object.entries(overrides)) {
    if (process.env[source] !== undefined) env[target] = process.env[source];
  }

  return env;
}

let failures = 0;

for (const [table, columns] of Object.entries(expected)) {
  const result = spawnSync("php", ["artisan", "db:table", table, "--json"], {
    cwd: backendRoot,
    env: backendEnvironment(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    console.error(`FAILED: ${table}: ${result.stderr.trim() || result.stdout.trim()}`);
    failures += 1;
    continue;
  }

  let actual;
  try {
    actual = JSON.parse(result.stdout);
  } catch (error) {
    console.error(`FAILED: ${table}: invalid db:table output`, error);
    failures += 1;
    continue;
  }

  const present = new Set(
    (actual.columns ?? []).map((column) =>
      typeof column === "string" ? column : column.column,
    ),
  );
  const missing = columns.filter((column) => !present.has(column));

  if (missing.length > 0) {
    console.error(`FAILED: ${table}: missing ${missing.join(", ")}`);
    failures += 1;
  } else {
    console.log(`OK: ${table} (${columns.length} expected columns)`);
  }
}

if (failures > 0) {
  console.error(`${failures} schema check(s) failed.`);
  process.exit(1);
}

console.log("All schema checks passed.");
