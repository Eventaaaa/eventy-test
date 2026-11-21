# eventy-test Wiki

Welcome to the **eventy-test** documentation hub.

## Start Here

- [Overview](Overview.md) — high-level summary, quick start, features, and troubleshooting.
- [Testing Framework Guide](8-testing-framework-guide.md) — test layout, commands, coverage, and pre-push gate.
- [Scripts](9-scripts.md) — `run-all.mjs`, `prepush.sh`, npm scripts, and environment variables.

## Build Order

Follow these guides in order when building Eventy from scratch:

1. [Backend Installation](1-backend-installation.md)
2. [Database Schema](2-database-schema.md)
3. [CRUD APIs for Core Models](3-crud-apis-for-core-models.md)
4. [Filtering Data](4-filtering-data.md)
5. [Venue CRUD and Media Management](5-venue-crud-and-media-management.md)
6. [Media Upload](6-media-upload.md)
7. [Payments CRUD](7-payments-crud.md)
8. [Testing Framework Guide](8-testing-framework-guide.md)
9. [Scripts](9-scripts.md)
10. [Future Features Roadmap](10-future-features-roadmap.md)

## Notes

- Backend tests run from `eventy-backend`.
- Frontend tests live under `eventy-test/tests/user` and `eventy-test/tests/venue`.
- Use `EVENTY_DB_*` environment variables for local MySQL overrides.
- Never run destructive database commands against a real database.
