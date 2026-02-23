#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_ENTRY="$ROOT_DIR/apps/api/src/main.js"

if [[ ! -f "$API_ENTRY" ]]; then
  echo "[smoke-api] Missing $API_ENTRY"
  echo "[smoke-api] Sync your branch and verify files:"
  echo "  git fetch origin"
  echo "  git checkout week2-catalog-circulation"
  echo "  git pull"
  echo "  find apps/api -maxdepth 3 -type f"
  exit 1
fi

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

node "$API_ENTRY" > /tmp/library-api.log 2>&1 &
API_PID=$!

for _ in {1..20}; do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

if ! curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1; then
  echo "[smoke-api] API did not start on port 3000. Recent log:"
  tail -n 40 /tmp/library-api.log || true
  exit 1
fi

echo "[smoke-api] /health"
curl -fsS http://127.0.0.1:3000/health

echo

echo "[smoke-api] /api/v1/books"
curl -fsS http://127.0.0.1:3000/api/v1/books

echo

echo "[smoke-api] /api/v1/books/book_1"
curl -fsS http://127.0.0.1:3000/api/v1/books/book_1

echo

echo "[smoke-api] PASS"
