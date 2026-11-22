# eventy-test

Centralized local test runner for the Eventy backend, user frontend, and venue frontend.

## Prerequisites

- Node.js 18+
- npm
- PHP 8.2+
- Composer
- MySQL (recommended locally)

Install dependencies once:

```bash
cd /home/aq/git/eventy/eventy-test
npm install
```

Backend dependencies must also be installed:

```bash
cd /home/aq/git/eventy/eventy-backend
composer install
```

## Local Database

Use a dedicated test database. Never point these tests at a production database.

```bash
export EVENTY_DB_CONNECTION=mysql
export EVENTY_DB_HOST=127.0.0.1
export EVENTY_DB_PORT=3306
export EVENTY_DB_DATABASE=eventy_test
export EVENTY_DB_USERNAME=root
export EVENTY_DB_PASSWORD=your_password
```

`eventy-test` maps `EVENTY_DB_*` to Laravel's `DB_*` variables. If you do not set them, Laravel uses the backend's normal test configuration.

Local PHP may not have `pdo_sqlite`; using MySQL avoids that issue.

## Shell Scripts

Run from `/home/aq/git/eventy/eventy-test`:

| Script | What it runs |
|---|---|
| `./test-backend.sh` | Backend Pest tests only |
| `./test-user.sh` | User frontend Vitest tests only |
| `./test-venue.sh` | Venue frontend Vitest tests only |
| `./test-all.sh` | Backend, user frontend, then venue frontend tests |
| `./prepush.sh` | Full gate: lint, typecheck, build, tests, and frontend coverage |

Make them executable if needed:

```bash
chmod +x test-backend.sh test-user.sh test-venue.sh test-all.sh prepush.sh
```

The four test scripts are wrappers around `scripts/run-all.mjs`, so they use the same paths, environment mapping, and output as the npm scripts.

## npm Equivalents

```bash
npm test
npm run test:backend
npm run test:user
npm run test:venue
npm run coverage
npm run prepush
```

## Running Individual Tests

Frontend:

```bash
npx vitest run --config vitest.user.config.ts tests/user/example.test.ts
npx vitest run --config vitest.venue.config.ts tests/venue/example.test.ts
```

Backend:

```bash
cd /home/aq/git/eventy/eventy-backend
php artisan test --filter=EventyTesterWorkflowTest
```

## Test Accounts

The backend provides a deterministic tester-account command:

```bash
cd /home/aq/git/eventy/eventy-backend
php artisan eventy:test-accounts
```

It creates the standard tester user, owner, venue, and team members. Run it only against a local or test database.

## Layout

```text
eventy-test/
├── doc-wiki/                 # Documentation
├── scripts/run-all.mjs       # Central test orchestrator
├── tests/user/               # User frontend tests
├── tests/venue/              # Venue frontend tests
├── vitest.user.config.ts
├── vitest.venue.config.ts
├── test-backend.sh
├── test-user.sh
├── test-venue.sh
├── test-all.sh
└── prepush.sh
```

Backend Pest tests remain in `eventy-backend/tests`.

## Coverage

```bash
npm run coverage
```

Reports are written to:

```text
coverage/user
coverage/venue
```

Backend coverage runs only when Xdebug or PCOV is available.

## Documentation

- [Wiki home](doc-wiki/Home.md)
- [Testing Framework Guide](doc-wiki/8-testing-framework-guide.md)
- [Scripts](doc-wiki/9-scripts.md)
