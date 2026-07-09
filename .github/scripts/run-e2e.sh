#!/usr/bin/env bash
# Start Backstage frontend and backend, run Playwright e2e tests, then stop both servers.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BACKEND_PID=""
FRONTEND_PID=""
BACKEND_LOG="${ROOT_DIR}/backend-e2e.log"
FRONTEND_LOG="${ROOT_DIR}/frontend-e2e.log"

cleanup() {
  for pid in "${FRONTEND_PID}" "${BACKEND_PID}"; do
    if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" 2>/dev/null || true
      wait "${pid}" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

export POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export GITHUB_TOKEN="${GITHUB_TOKEN:-e2e-ci-token}"
export BACKSTAGE_TEST_DISABLE_DOCKER="${BACKSTAGE_TEST_DISABLE_DOCKER:-1}"
export CI=true
export PLAYWRIGHT_URL="${PLAYWRIGHT_URL:-http://localhost:3000}"

echo "Starting Backstage backend for e2e tests..."
dotenv -e .env -- yarn workspace backend start >"${BACKEND_LOG}" 2>&1 &
BACKEND_PID=$!

echo "Starting Backstage frontend for e2e tests..."
dotenv -e .env -- yarn workspace app start >"${FRONTEND_LOG}" 2>&1 &
FRONTEND_PID=$!

echo "Waiting for frontend at ${PLAYWRIGHT_URL} ..."
ready=false
for attempt in $(seq 1 90); do
  if curl -sf "${PLAYWRIGHT_URL}" >/dev/null; then
    ready=true
    break
  fi
  if ! kill -0 "${BACKEND_PID}" 2>/dev/null || ! kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    echo "Backstage process exited before becoming ready." >&2
    tail -n 40 "${BACKEND_LOG}" >&2 || true
    tail -n 40 "${FRONTEND_LOG}" >&2 || true
    exit 1
  fi
  sleep 2
done

if [[ "${ready}" != "true" ]]; then
  echo "Timed out waiting for Backstage frontend." >&2
  tail -n 40 "${BACKEND_LOG}" >&2 || true
  tail -n 40 "${FRONTEND_LOG}" >&2 || true
  exit 1
fi

echo "Backstage is ready. Running Playwright e2e tests..."
PLAYWRIGHT_JSON_OUTPUT_NAME=playwright-results.json yarn test:e2e
