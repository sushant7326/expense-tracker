#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# dev.sh  —  Start FinTrack locally (no Docker required)
#
# Services:
#   Frontend  → http://localhost:3000   (python3 static server)
#   Backend   → http://localhost:5000   (Node/Express + PostgreSQL)
#
# Prerequisites:
#   • PostgreSQL running locally with expense_tracker database
#   • .env file in the project root (copy from .env.example)
#   • node in PATH  (nvm: `nvm use`)
#   • python3 in PATH
# ─────────────────────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Colour helpers ──────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # no colour

echo ""
echo -e "${CYAN}  FinTrack Dev Server${NC}"
echo -e "${CYAN}  ────────────────────────────────────${NC}"
echo -e "${GREEN}  Frontend${NC}  → http://localhost:3000"
echo -e "${GREEN}  Backend ${NC}  → http://localhost:5000"
echo ""
echo -e "${YELLOW}  Press Ctrl+C to stop both servers${NC}"
echo ""

# ── Sanity checks ───────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env file not found in project root."
  echo "  Copy .env.example → .env and fill in your values."
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install it or serve the frontend manually:"
  echo "  cd frontend && npx serve -l 3000"
  exit 1
fi

if ! command -v node &>/dev/null; then
  echo "ERROR: node not found. Make sure it is in your PATH (e.g. run: nvm use)"
  exit 1
fi

# ── Start services ──────────────────────────────────────────
(cd "$ROOT_DIR/backend" && node server.js 2>&1 | sed "s/^/[backend] /") &
BACKEND_PID=$!

(cd "$ROOT_DIR/frontend" && python3 -m http.server 3000 2>&1 | sed "s/^/[frontend] /") &
FRONTEND_PID=$!

# ── Cleanup on exit ─────────────────────────────────────────
cleanup() {
  echo ""
  echo "Stopping servers…"
  kill "$BACKEND_PID"  2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

wait
