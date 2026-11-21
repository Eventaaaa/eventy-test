# Eventy Test Framework Overview

## Purpose
`eventy-test` is a centralized pre‑push testing suite that runs backend, user‑frontend, and venue‑frontend checks, produces coverage reports, and verifies the new features (green confirmed icons, self‑service account deletion, site‑settings‑driven content, etc.) before any code is pushed.

## Project Structure (relative to `/home/aq/git/eventy/eventy-test`)
```
doc-wiki/          # Markdown reference guides
coverage/          # Generated coverage reports (html/lcov)
node_modules/      # npm devDependencies (vitest, @vitest/coverage‑v8, jsdom, @testing‑library/react, react, react‑dom)
package.json       # npm scripts & devDependencies
prepush.sh         # Central pre‑push gate (updated paths)
scripts/           # helper scripts (run‑all.mjs, test‑*.sh)
tests/             # Pest feature tests for backend + frontend
vitest.user.config.ts   # Vitest config for user frontend
vitest.venue.config.ts  # Vitest config for venue/frontend
```

## Quick Start
```bash
# 1️⃣  Install npm dependencies (once)
cd /home/aq/git/eventy/eventy-test
npm install                # generates package‑lock.json

# 2️⃣  Ensure a MySQL database is reachable (CI uses SQLite, local needs MySQL)
#    Set env vars from the backend .env (do NOT commit secrets):
#    export EVENTY_DB_CONNECTION=mysql
#    export EVENTY_DB_HOST=127.0.0.1
#    export EVENTY_DB_PORT=3306
#    export EVENTY_DB_DATABASE=eventy_test
#    export EVENTY_DB_USERNAME=root
#    export EVENTY_DB_PASSWORD=your_password

# 3️⃣  Create the tester accounts (one‑off, idempotent)
php artisan eventy:test-accounts

# 4️⃣  Run the full tester workflow (creates accounts in a temp DB, runs API tests, then tears down)
php artisan test --filter=EventyTesterWorkflowTest
```

## Available npm Scripts (via `package.json`)
| Script | What it does |
|--------|--------------|
| `test` | Runs **all** suites: backend (with MySQL env), user‑frontend vitest, venue‑frontend vitest. |
| `test:backend` | Only backend Pest suite (uses `EVENTY_DB_CONNECTION` etc.). |
| `test:user` | Only user‑frontend vitest tests (coverage included). |
| `test:venue` | Only venue‑frontend vitest tests (coverage included). |
| `coverage` | Runs everything with coverage; reports written to `coverage/user/` and `coverage/venue/`. |
| `prepush` | Executes `prepush.sh` which runs lint, typecheck, build, tests, and centralized coverage. |

## Key Features Implemented
- **Green confirmed status icons** in both user and owner `BookingDetail` pages (green Check badge, green `STATUS_STYLES` in utils.ts).
- **Self‑service account deletion**: `DELETE /api/v1/profile` with password confirmation, token revocation, and safe DB clean‑up (bookings, payments, reviews, venues, team members). Tests in `AccountDeletionApiTest.php`.
- **Deterministic tester accounts**: Artisan command `php artisan eventy:test-accounts` creates `test‑user`, `owner‑test`, one venue, two team members; prints a clear table of emails/passwords and login URL.
- **Full API lifecycle test**: `EventyTesterWorkflowTest.php` covers registration, profile, venue creation, team‑member management, booking confirmation, account deletion, and permission checks.
- **Site‑settings‑driven content**: All public contact/info (company name/address/phone/email/hours, about/terms/privacy/frequently asked questions) stored in the `site_settings` DB table and read by the frontend via `getSiteSettings()`. Frontend components updated: `Footer`, `Help`, `About`, `Terms`, `Privacy`, `Navbar`, `Auth`.
- **Backend self‑service deletion endpoint**: `DELETE /api/v1/profile` added, with `DeleteAccountRequest` validation and `ProfileController::destroy()` service.
- **Vitest coverage** for both frontends (v8 reporter, HTML + LCOV output).
- **Pre‑push gate** (`prepush.sh`) now uses the correct project paths (`eventy-user-frontend`, `eventy-venue-frontend`, `eventy-backend`) and runs lint, typecheck, build, tests, and coverage in one command.

## Troubleshooting
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `could not find driver (pdo_sqlite)` when running backend tests | Missing SQLite PDO extension on PHP | Install `pdo_mysql` or run tests against MySQL (`EVENTY_DB_CONNECTION=mysql ...`). |
| `npm test` fails with “vitest not found” | `node_modules` not installed or wrong Node version | `rm -rf node_modules package-lock.json && npm install`; ensure Node ≥ 18. |
| `prepush.sh` reports “route:list failed” | Backend not reachable or DB env missing | Verify `EVENTY_DB_*` env vars and that `php artisan serve` (or actual MySQL) is running. |
| Frontend tests timeout or “cannot find module” | Missing `@vitest/coverage‑v8` or `@testing‑library/react` | `npm install --save-dev @vitest/coverage‑v8 @testing‑library/react @testing‑library/jest‑dom` inside `eventy-test`. |
| `npm run typecheck` reports `TS5103: Invalid value for '--ignoreDeprecations'` | Deprecated option in tsconfig (already removed) | No action needed; the option was removed from `tsconfig.app.json`. |

## Contact / Maintainer
- This file lives in `/home/aq/git/eventy/eventy-test/doc-wiki/Overview.md`.
- For changes or questions, open an issue in the eventy repository or ping the maintainers.