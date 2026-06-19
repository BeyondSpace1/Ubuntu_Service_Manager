#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Service Commander v2 — Robust Installer
#  Optimized for GNOME 45+ & Native DBus Integration
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# --- Configuration ---
UUID="service-commander@beyondspace"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- UI Helpers ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Service Commander v2 Installer         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# --- 1. Environment Validation ---
echo -n "🔍 Checking environment... "
if ! command -v gnome-shell &>/dev/null; then
    echo -e "${RED}FAILED${NC}"
    echo "❌ GNOME Shell not found. This is a GNOME extension."
    exit 1
fi

GNOME_VER=$(gnome-shell --version | grep -oP '\d+' | head -1)
if [ "$GNOME_VER" -lt 45 ]; then
    echo -e "${RED}INCOMPATIBLE${NC}"
    echo "❌ GNOME $GNOME_VER detected. Version 2.0 requires GNOME 45+ (ESM support)."
    exit 1
fi
echo -e "${GREEN}GNOME $GNOME_VER detected${NC}"

# --- 2. Clean Installation ---
echo -e "📁 Preparing directory: ${BLUE}$EXT_DIR${NC}"
rm -rf "$EXT_DIR"
mkdir -p "$EXT_DIR"

# --- 3. Deploy Assets ---
echo "🚀 Deploying Service Commander v2 assets..."
FILES=("extension.js" "metadata.json" "stylesheet.css" "CHANGELOG.md")

for file in "${FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$EXT_DIR/"
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (missing!)"
        exit 1
    fi
done

# --- 4. Post-Install Tasks ---
echo ""
echo -e "${YELLOW}🔌 Activation${NC}"
if gnome-extensions enable "$UUID" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Extension auto-enabled"
else
    echo -e "  ${YELLOW}ℹ${NC} Please enable via 'Extensions' app or extensions.gnome.org"
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ v2.0.1 Installation Successful!          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "To complete activation, restart GNOME Shell:"
echo -e "  ${BLUE}• Wayland:${NC} Log out and log back in."
echo -e "  ${BLUE}• X11:${NC}     Press Alt+F2, type 'r', and Enter."
echo ""
echo -e "Full changelog available at: ${BLUE}$EXT_DIR/CHANGELOG.md${NC}"
echo ""
