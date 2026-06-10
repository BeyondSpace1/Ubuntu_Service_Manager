#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Service Commander — Install Script
#  Supports GNOME 45, 46, 47, 48
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

UUID="service-commander@beyondspace"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_SRC="$SCRIPT_DIR/org.beyondspace.servicecommander.policy"
POLICY_DST="/usr/share/polkit-1/actions/org.beyondspace.servicecommander.policy"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       Service Commander — Installer          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Check GNOME Shell ─────────────────────────────────────────────────────
if ! command -v gnome-shell &>/dev/null; then
  echo "❌  GNOME Shell not found. This extension requires GNOME."
  exit 1
fi

GNOME_VERSION=$(gnome-shell --version | grep -oP '\d+' | head -1)
echo "✅  GNOME Shell $GNOME_VERSION detected"

# ── 2. Install extension files ───────────────────────────────────────────────
echo "📁  Installing to $INSTALL_DIR …"
mkdir -p "$INSTALL_DIR"
cp "$SCRIPT_DIR/extension.js"  "$INSTALL_DIR/"
cp "$SCRIPT_DIR/metadata.json" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/stylesheet.css" "$INSTALL_DIR/"
echo "✅  Extension files copied"

# ── 3. Install polkit policy (needs sudo) ────────────────────────────────────
echo ""
echo "🔑  Installing polkit policy (requires sudo for /usr/share/polkit-1/actions/)"
if sudo cp "$POLICY_SRC" "$POLICY_DST"; then
  echo "✅  Polkit policy installed — service toggles will prompt for password once per session"
else
  echo "⚠️   Polkit install skipped. Toggling services may not work without it."
  echo "    Run manually:  sudo cp '$POLICY_SRC' '$POLICY_DST'"
fi

# ── 4. Enable extension ──────────────────────────────────────────────────────
echo ""
echo "🔌  Enabling extension…"
if gnome-extensions enable "$UUID" 2>/dev/null; then
  echo "✅  Extension enabled"
else
  echo "⚠️   Could not auto-enable. Enable manually:"
  echo "    gnome-extensions enable $UUID"
  echo "    — or use GNOME Extensions app / extensions.gnome.org"
fi

# ── 5. Restart shell hint ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  Installation complete!                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Next step — restart GNOME Shell to activate:"
echo ""
echo "  • Wayland (most Ubuntu 22.04+):  Log out and log back in"
echo "  • X11:                           Press Alt+F2, type 'r', press Enter"
echo ""
echo "  Then look for '⚙ Services' in your top panel."
echo ""
