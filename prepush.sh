#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/../eventy-backend"
USER_FRONTEND="$ROOT/../eventy-user-frontend"
VENUE_FRONTEND="$ROOT/../eventy-venue-frontend"
STATUS=0

run() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  "$@" || STATUS=1
}

backend_env=()
for pair in \
  "EVENTY_DB_CONNECTION:DB_CONNECTION" \
  "EVENTY_DB_HOST:DB_HOST" \
  "EVENTY_DB_PORT:DB_PORT" \
  "EVENTY_DB_DATABASE:DB_DATABASE" \
  "EVENTY_DB_USERNAME:DB_USERNAME" \
  "EVENTY_DB_PASSWORD:DB_PASSWORD"; do
  source_name="${pair%%:*}"
  target_name="${pair##*:}"
  if [ -n "${!source_name+x}" ]; then
    backend_env+=("$target_name=${!source_name}")
  fi
done

if command -v php >/dev/null 2>&1; then
  run "backend pint --dirty" bash -c "cd '$BACKEND' && vendor/bin/pint --dirty --test"

  printf '\n==> backend php lint\n'
  lint_failures=0
  while IFS= read -r -d '' file; do
    if ! php -l "$file" >/dev/null; then
      printf 'PHP lint failed: %s\n' "$file"
      lint_failures=$((lint_failures + 1))
    fi
  done < <(find "$BACKEND/app" "$BACKEND/bootstrap" "$BACKEND/config" "$BACKEND/database" "$BACKEND/routes" "$BACKEND/tests" -type f -name '*.php' -print0)
  if [ "$lint_failures" -ne 0 ]; then
    printf '%s PHP file(s) failed lint.\n' "$lint_failures"
    STATUS=1
  fi

  run "backend routes" env "${backend_env[@]}" bash -c "cd '$BACKEND' && php artisan route:list --json >/dev/null"
  run "backend tests" node "$ROOT/scripts/run-all.mjs" backend
else
  printf '\n==> backend skipped (php unavailable)\n'
fi

run "user frontend lint" bash -c "cd '$USER_FRONTEND' && npm run lint"
run "user frontend build" bash -c "cd '$USER_FRONTEND' && npm run build"
run "user frontend tests" node "$ROOT/scripts/run-all.mjs" user

run "venue frontend lint" bash -c "cd '$VENUE_FRONTEND' && npm run lint"
run "venue frontend typecheck" bash -c "cd '$VENUE_FRONTEND' && npm run typecheck"
run "venue frontend build" bash -c "cd '$VENUE_FRONTEND' && npm run build"
run "venue frontend tests" node "$ROOT/scripts/run-all.mjs" venue

run "centralized frontend coverage" node "$ROOT/scripts/run-all.mjs" frontend-coverage

printf '\n'
if [ "$STATUS" -ne 0 ]; then
  printf 'Prepush checks failed.\n'
  exit 1
fi

printf 'Prepush checks passed.\n'
