# Testing Framework Guide

This guide documents the centralized test harness in `/home/aq/git/eventy/eventy-test`.

## Directory Layout

```text
eventy-test/
├── doc-wiki/                 # Markdown documentation
├── scripts/run-all.mjs       # Central test orchestrator
├── tests/
│   ├── setup.ts              # Shared Vitest setup
│   ├── user/                 # User-frontend Vitest tests
│   └── venue/                # Venue-frontend Vitest tests
├── vitest.user.config.ts     # User frontend Vitest config
├── vitest.venue.config.ts    # Venue frontend Vitest config
├── prepush.sh                # Pre-push gate
└── package.json              # npm scripts and devDependencies
```

Backend Pest tests still live in `/home/aq/git/eventy/eventy-backend/tests` and are executed by `run-all.mjs` from that project. Frontend aliases point `@` to the corresponding frontend `src` directory, so moved tests keep their original imports.

## Commands

Run from `/home/aq/git/eventy/eventy-test`:

```bash
npm install
npm test
npm run test:backend
npm run test:user
npm run test:venue
npm run coverage
npm run prepush
```

| Script | Behavior |
|---|---|
| `npm test` | Backend Pest, then user Vitest, then venue Vitest. |
| `npm run test:backend` | Backend Pest suite only. Uses `EVENTY_DB_*` overrides when present. |
| `npm run test:user` | User frontend Vitest tests only. |
| `npm run test:venue` | Venue frontend Vitest tests only. |
| `npm run coverage` | All suites with coverage; reports go to `coverage/user` and `coverage/venue`. |
| `npm run prepush` | Runs `prepush.sh`: lint, typecheck, build, tests, and centralized coverage. |

Local shell wrappers:

```bash
./test-backend.sh
./test-user.sh
./test-venue.sh
./test-all.sh
./prepush.sh
```

## Backend Environment

Backend tests default to SQLite in `phpunit.xml`. Local PHP may not have `pdo_sqlite`; use MySQL overrides:

```bash
export EVENTY_DB_CONNECTION=mysql
export EVENTY_DB_HOST=127.0.0.1
export EVENTY_DB_PORT=3306
export EVENTY_DB_DATABASE=eventy_test
export EVENTY_DB_USERNAME=root
export EVENTY_DB_PASSWORD=your_password
```

The runner maps `EVENTY_DB_*` variables to Laravel's `DB_*` variables. Do not use `migrate:fresh`, `migrate:reset`, `db:wipe`, or destructive seeding on a real database.

## Centralized Test Rules

- Keep user-frontend tests under `tests/user`.
- Keep venue-frontend tests under `tests/venue`.
- Update import paths when moving tests:
  - Venue frontend tests that reference `./Component` must use `@/pages/...` or `@/components/...`.
- Run the relevant suite after moving or changing tests:
  - `npm run test:user`
  - `npm run test:venue`
  - `npm run test:backend`

## Coverage

Coverage uses Vitest v8. Reports are written to:

```text
eventy-test/coverage/user
eventy-test/coverage/venue
```

Backend coverage requires Xdebug or PCOV. If neither is available, the runner skips backend coverage and still runs the tests.

## Pre-Push Gate

`prepush.sh` runs:

1. User frontend: lint, typecheck, build.
2. Venue frontend: lint, typecheck, build.
3. Backend: lint, typecheck, build assets, Pest tests.
4. Centralized frontend tests and coverage.

The script uses the correct project paths:

- `eventy-user-frontend`
- `eventy-venue-frontend`
- `eventy-backend`

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `could not find driver (pdo_sqlite)` | Local PHP lacks SQLite PDO | Use MySQL overrides or install `pdo_sqlite`. |
| `npm test` cannot find Vitest | Dependencies not installed | Run `npm install`. |
| Moved venue test cannot resolve `@/...` | Alias not configured | Check `vitest.venue.config.ts` aliases. |
| Moved test references `./Component` | Relative path changed | Change to `@/...`. |
| Backend tests fail after moving files | Autoload or phpunit paths changed | Update `composer.json` autoload-dev and `phpunit.xml`. |
| Coverage missing | No Xdebug/PCOV | Install a PHP coverage driver or run frontend coverage only. |

## Related Files

- `package.json`
- `scripts/run-all.mjs`
- `prepush.sh`
- `vitest.user.config.ts`
- `vitest.venue.config.ts`
- `tests/setup.ts`