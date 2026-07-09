#!/usr/bin/env bash
# Inspect Backstage plugin databases, connections, and recent catalog migrations.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/postgres-tools.sh"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

PSQL="$(require_psql)"
export PGPASSWORD="$POSTGRES_PASSWORD"

psql_cmd() {
  "$PSQL" -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$@"
}

echo "== Plugin databases =="
psql_cmd -c "SELECT datname FROM pg_database WHERE datname LIKE 'backstage_plugin_%' ORDER BY datname;"

echo "== Active connections =="
psql_cmd -c "SELECT datname, count(*) AS connections FROM pg_stat_activity WHERE datname LIKE 'backstage_plugin_%' GROUP BY datname ORDER BY datname;"

echo "== Recent catalog migrations =="
if psql_cmd -tAc "SELECT 1 FROM pg_database WHERE datname = 'backstage_plugin_catalog'" | grep -q 1; then
  psql_cmd -d backstage_plugin_catalog -c "SELECT name FROM knex_migrations ORDER BY id DESC LIMIT 5;"
else
  echo "(backstage_plugin_catalog not created yet — start the backend once with yarn start or yarn start:local)"
fi
