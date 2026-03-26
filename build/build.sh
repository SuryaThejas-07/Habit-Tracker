#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# build.sh – Habit Tracking System Build Script
# Usage: bash build/build.sh [--prod]
# ─────────────────────────────────────────────────────────────

set -e  # Exit immediately on error

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

echo -e "${CYAN}${BOLD}"
echo "  ██╗  ██╗ █████╗ ██████╗ ██╗████████╗███████╗██╗      ██████╗ ██╗    ██╗"
echo "  ██║  ██║██╔══██╗██╔══██╗██║╚══██╔══╝██╔════╝██║     ██╔═══██╗██║    ██║"
echo "  ███████║███████║██████╔╝██║   ██║   █████╗  ██║     ██║   ██║██║ █╗ ██║"
echo "  ██╔══██║██╔══██║██╔══██╗██║   ██║   ██╔══╝  ██║     ██║   ██║██║███╗██║"
echo "  ██║  ██║██║  ██║██████╔╝██║   ██║   ██║     ███████╗╚██████╔╝╚███╔███╔╝"
echo "  ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ "
echo -e "${NC}"
echo -e "${BOLD}  Habit Tracking System – Build Script${NC}"
echo "  ─────────────────────────────────────"

# ─── Step 1: Check Node.js ─────────────────────────────────
echo -e "\n${CYAN}[1/5] Checking Node.js version...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js v18+ is required. Found: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# ─── Step 2: Check npm ─────────────────────────────────────
echo -e "\n${CYAN}[2/5] Checking npm...${NC}"
if ! command -v npm &>/dev/null; then
  echo -e "${RED}✗ npm is not installed.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# ─── Step 3: Install dependencies ──────────────────────────
echo -e "\n${CYAN}[3/5] Installing dependencies...${NC}"
# Navigate to project root (one level up from build/)
cd "$(dirname "$0")/.."

npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ─── Step 4: Check .env ────────────────────────────────────
echo -e "\n${CYAN}[4/5] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠ .env not found. Creating from .env.example...${NC}"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env created from template. Please update JWT_SECRET before production.${NC}"
  else
    echo -e "${RED}✗ No .env or .env.example found. Creating default .env...${NC}"
    cat > .env <<EOF
PORT=3000
JWT_SECRET=habit_tracker_jwt_secret_change_in_production
DB_PATH=./database/habit_tracker.db
EOF
  fi
else
  echo -e "${GREEN}✓ .env found${NC}"
fi

# ─── Step 5: Ensure database directory exists ──────────────
echo -e "\n${CYAN}[5/5] Preparing database directory...${NC}"
mkdir -p database
echo -e "${GREEN}✓ Database directory ready${NC}"

# ─── Done ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Build complete!${NC}"
echo ""
echo -e "  Start the server:    ${CYAN}npm run dev${NC}"
echo -e "  Open in browser:     ${CYAN}http://localhost:3000/login.html${NC}"
echo ""

# Auto-start if --prod flag passed
if [ "$1" = "--prod" ]; then
  echo -e "${YELLOW}Starting production server...${NC}"
  npm start
elif [ "$1" = "--dev" ]; then
  echo -e "${YELLOW}Starting development server with hot-reload...${NC}"
  npm run dev
fi
