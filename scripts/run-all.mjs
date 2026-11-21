import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.dirname(root);
const backendRoot = path.join(projectRoot, "eventy-backend");
const vitestCli = path.join(root, "node_modules", "vitest", "vitest.mjs");

let failures = 0;

function announce(message) {
  console.log(`\n==> ${message}`);
}

function run(label, command, args, options = {}) {
  announce(label);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`ERROR: ${label}: ${result.error.message}`);
    failures += 1;
    return false;
  }
  if (result.status !== 0) {
    console.error(`FAILED: ${label} (exit ${result.status ?? 1})`);
    failures += 1;
    return false;
  }
  return true;
}

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

function hasPhpCoverageDriver() {
  const probe = spawnSync(
    "php",
    [
      "-r",
      'echo (extension_loaded("xdebug") && function_exists("xdebug_start_code_coverage")) || extension_loaded("pcov") ? "yes" : "no";',
    ],
    { encoding: "utf8" },
  );
  return probe.status === 0 && probe.stdout.trim() === "yes";
}

function runBackendTests() {
  const env = backendEnvironment();
  const coverage = hasPhpCoverageDriver();

  if (!coverage) {
    announce("backend coverage skipped (no Xdebug/PCOV driver available)");
  } else {
    env.XDEBUG_MODE = "coverage";
  }

  run("backend config:clear", "php", ["artisan", "config:clear"], { cwd: backendRoot, env });
  run(
    coverage ? "backend tests (coverage enabled)" : "backend tests",
    "php",
    ["artisan", "test", ...(coverage ? ["--coverage"] : [])],
    { cwd: backendRoot, env },
  );
}

function runFrontendTests(target, config, withCoverage) {
  const args = [vitestCli, "run", "--config", config];
  if (withCoverage) args.push("--coverage");
  run(`${target} frontend tests${withCoverage ? " with coverage" : ""}`, process.execPath, args);
}

function runFrontendCoverage() {
  runFrontendTests("user", "vitest.user.config.ts", true);
  runFrontendTests("venue", "vitest.venue.config.ts", true);
  console.log("\nCoverage reports: eventy-test/coverage/user and eventy-test/coverage/venue");
}

function finish() {
  console.log("");
  if (failures > 0) {
    console.error(`${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

const mode = process.argv[2] ?? "test";

if (mode === "test") {
  runBackendTests();
  runFrontendTests("user", "vitest.user.config.ts", false);
  runFrontendTests("venue", "vitest.venue.config.ts", false);
} else if (mode === "backend") {
  runBackendTests();
} else if (mode === "user") {
  runFrontendTests("user", "vitest.user.config.ts", false);
} else if (mode === "venue") {
  runFrontendTests("venue", "vitest.venue.config.ts", false);
} else if (mode === "integration") {
  run("HTTP integration tests", process.execPath, [
    vitestCli,
    "run",
    "--config",
    "vitest.integration.config.ts",
  ]);
} else if (mode === "coverage") {
  runBackendTests();
  runFrontendCoverage();
} else if (mode === "frontend-coverage") {
  runFrontendCoverage();
} else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(2);
}

finish();
