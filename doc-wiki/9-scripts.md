# Scripts

The test harness is driven by `scripts/run-all.mjs` and `prepush.sh`.

## `scripts/run-all.mjs`

Central orchestrator for backend Pest tests and both frontend Vitest suites.

```bash
node scripts/run-all.mjs test
node scripts/run-all.mjs backend
node scripts/run-all.mjs user
node scripts/run-all.mjs venue
node scripts/run-all.mjs coverage
node scripts/run-all.mjs frontend-coverage
```

| Mode | Behavior |
|---|---|
| `test` | Backend tests, user frontend tests, then venue frontend tests. |
| `backend` | Backend Pest tests only. |
| `user` | User frontend Vitest tests only. |
| `venue` | Venue frontend Vitest tests only. |
| `coverage` | Backend tests plus user and venue frontend coverage. |
| `frontend-coverage` | User and venue frontend coverage only. |

The backend runner:

1. Copies `EVENTY_DB_CONNECTION`, `EVENTY_DB_HOST`, `EVENTY_DB_PORT`, `EVENTY_DB_DATABASE`/`EVENTY_DB_NAME`, `EVENTY_DB_USERNAME`, and `EVENTY_DB_PASSWORD` to Laravel's `DB_*` variables.
2. Runs `php artisan config:clear` in `eventy-backend`.
3. Runs `php artisan test`.
4. Enables backend coverage only when Xdebug or PCOV is available.

Frontend coverage reports are written to `coverage/user` and `coverage/venue`.

## `prepush.sh`

Run the complete pre-push gate:

```bash
bash prepush.sh
```

It performs:

1. Backend `pint --dirty --test`.
2. PHP syntax checks across backend source and tests.
3. Backend route listing and backend tests.
4. User frontend lint, build, and tests.
5. Venue frontend lint, typecheck, build, and tests.
6. Centralized frontend coverage.

The script skips backend checks when `php` is unavailable. Any failed step sets a non-zero exit status.

## Local Shell Scripts

| Script | Mode |
|---|---|
| `./test-backend.sh` | `backend` |
| `./test-user.sh` | `user` |
| `./test-venue.sh` | `venue` |
| `./test-all.sh` | `test` |
| `./prepush.sh` | Full lint, build, test, and coverage gate |

The test wrappers call `scripts/run-all.mjs`, so they behave exactly like the matching npm scripts.

## npm Scripts

`package.json` exposes:

| Script | Command |
|---|---|
| `npm test` | `node scripts/run-all.mjs test` |
| `npm run test:backend` | `node scripts/run-all.mjs backend` |
| `npm run test:user` | `node scripts/run-all.mjs user` |
| `npm run test:venue` | `node scripts/run-all.mjs venue` |
| `npm run coverage` | `node scripts/run-all.mjs coverage` |
| `npm run prepush` | `bash prepush.sh` |

## Environment

Use `EVENTY_DB_*` variables for backend database overrides. Never run destructive database commands against a real database.

```bash
export EVENTY_DB_CONNECTION=mysql
export EVENTY_DB_HOST=127.0.0.1
export EVENTY_DB_PORT=3306
export EVENTY_DB_DATABASE=eventy_test
export EVENTY_DB_USERNAME=root
export EVENTY_DB_PASSWORD=your_password
```

## Notes

- `test-backend.sh`, `test-user.sh`, `test-venue.sh`, and `test-all.sh` are thin wrappers around `run-all.mjs`.
- Frontend aliases are defined in `vitest.user.config.ts` and `vitest.venue.config.ts`.
- Backend tests currently run from `eventy-backend`; frontend tests are centralized under `tests/user` and `tests/venue`.
