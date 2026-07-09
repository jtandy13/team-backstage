#!/usr/bin/env bash
# Resolve common PostgreSQL client binaries (PATH + Homebrew keg-only installs).
# shellcheck shell=bash

find_pg_bin() {
  local name="$1"
  local candidate

  if command -v "$name" >/dev/null 2>&1; then
    command -v "$name"
    return 0
  fi

  for candidate in \
    "/opt/homebrew/opt/libpq/bin/${name}" \
    "/usr/local/opt/libpq/bin/${name}" \
    "/opt/homebrew/opt/postgresql@18/bin/${name}" \
    "/opt/homebrew/opt/postgresql@17/bin/${name}" \
    "/opt/homebrew/opt/postgresql@16/bin/${name}" \
    "/opt/homebrew/opt/postgresql/bin/${name}" \
    "/usr/local/opt/postgresql@18/bin/${name}" \
    "/usr/local/opt/postgresql@17/bin/${name}" \
    "/usr/local/opt/postgresql@16/bin/${name}" \
    "/usr/local/opt/postgresql/bin/${name}"; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

require_psql() {
  local psql_bin
  if ! psql_bin="$(find_pg_bin psql)"; then
    echo "psql not found. Install PostgreSQL client tools, then re-run." >&2
    echo "  macOS: brew install postgresql@16   # or: brew install libpq && brew link --force libpq" >&2
    echo "  Linux: sudo apt install postgresql-client" >&2
    return 1
  fi
  echo "$psql_bin"
}
