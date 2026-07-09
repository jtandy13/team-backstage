#!/usr/bin/env bash
# Start native PostgreSQL (if needed), then Backstage frontend + backend.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck disable=SC1091
source "${ROOT_DIR}/scripts/postgres-tools.sh"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

# Load connection settings for readiness checks (defaults match .env.example).
set -a
# shellcheck disable=SC1091
source .env
set +a

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

PG_ISREADY="$(find_pg_bin pg_isready || true)"

postgres_ready() {
  if [[ -n "${PG_ISREADY}" ]]; then
    "$PG_ISREADY" -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" >/dev/null 2>&1
  else
    # Fallback when client tools are not on PATH.
    (echo >/dev/tcp/"$POSTGRES_HOST"/"$POSTGRES_PORT") >/dev/null 2>&1
  fi
}

start_postgres() {
  if postgres_ready; then
    echo "PostgreSQL already ready at ${POSTGRES_HOST}:${POSTGRES_PORT}"
    return 0
  fi

  echo "Starting native PostgreSQL..."

  if command -v brew >/dev/null 2>&1; then
    local formula=""
    for candidate in postgresql@16 postgresql@17 postgresql@18 postgresql; do
      if brew list --formula "$candidate" >/dev/null 2>&1; then
        formula="$candidate"
        break
      fi
    done
    if [[ -z "$formula" ]]; then
      echo "PostgreSQL is not installed via Homebrew." >&2
      echo "Install with: brew install postgresql@16" >&2
      exit 1
    fi
    brew services start "$formula"
  elif command -v pg_ctlcluster >/dev/null 2>&1; then
    local version=""
    version="$(pg_lsclusters -h 2>/dev/null | awk '/main/ {print $1; exit}')"
    if [[ -z "$version" ]]; then
      # Prefer 16 (Cloud VM default), then any installed cluster.
      for candidate in 16 17 18 15 14; do
        if [[ -d "/etc/postgresql/${candidate}/main" ]]; then
          version="$candidate"
          break
        fi
      done
    fi
    if [[ -z "$version" ]]; then
      echo "No PostgreSQL cluster found. Install PostgreSQL 16+ and try again." >&2
      exit 1
    fi
    if command -v sudo >/dev/null 2>&1; then
      sudo pg_ctlcluster "$version" main start
    else
      pg_ctlcluster "$version" main start
    fi
  else
    echo "Could not start PostgreSQL automatically." >&2
    echo "Install and start PostgreSQL 16+, then re-run this script." >&2
    echo "  macOS: brew install postgresql@16 && brew services start postgresql@16" >&2
    echo "  Linux: sudo pg_ctlcluster 16 main start" >&2
    exit 1
  fi

  local attempt
  for attempt in $(seq 1 30); do
    if postgres_ready; then
      echo "PostgreSQL is ready at ${POSTGRES_HOST}:${POSTGRES_PORT}"
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}" >&2
  exit 1
}

start_postgres

exec yarn start
