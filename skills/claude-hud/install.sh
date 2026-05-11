#!/bin/bash

echo "========================================"
echo "  Claude HUD Plugin Installer (macOS/Linux)"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js >= 16"
    echo "        Download: https://nodejs.org/"
    exit 1
fi

NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 16 ]; then
    echo "[ERROR] Node.js version too old. Required >= 16, found: $(node -v)"
    exit 1
fi
echo "[OK] Node.js version: $(node -v)"

# Set paths
PLUGIN_DIR="$HOME/.claude/plugins/claude-hud"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create plugin directory
echo ""
echo "[1/5] Creating plugin directory..."
mkdir -p "$PLUGIN_DIR/src"

# Copy source files
echo "[2/5] Copying source files..."
cp -f "$SCRIPT_DIR/hud/src/"*.ts "$PLUGIN_DIR/src/"
cp -f "$SCRIPT_DIR/hud/package.json" "$PLUGIN_DIR/"
cp -f "$SCRIPT_DIR/hud/tsconfig.json" "$PLUGIN_DIR/"
echo "[OK] Source files copied"

# Install dependencies
echo "[3/5] Installing dependencies..."
cd "$PLUGIN_DIR" || exit 1
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed"
    exit 1
fi
echo "[OK] Dependencies installed"

# Build
echo "[4/5] Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Build failed"
    exit 1
fi
echo "[OK] Build complete"

# Create default config
echo "[5/5] Creating default configuration..."
mkdir -p "$HOME/.claude"
if [ ! -f "$HOME/.claude/hud-config.json" ]; then
    cat > "$HOME/.claude/hud-config.json" << 'EOF'
{
  "preset": "full",
  "enabled": true
}
EOF
    echo "[OK] Default hud-config.json created"
else
    echo "[SKIP] hud-config.json already exists"
fi

# Check sqlite3 (optional)
echo ""
echo "Checking optional dependencies..."
if command -v sqlite3 &> /dev/null; then
    echo "[OK] sqlite3 CLI available"
else
    echo "[INFO] sqlite3 CLI not found (optional)"
    echo "       CC Switch model detection will use fallback method"
    echo "       Install via: brew install sqlite3"
fi

# Done
echo ""
echo "========================================"
echo "  Installation complete!"
echo "========================================"
echo ""
echo "Please restart Claude Code to see the HUD status bar."
echo ""
echo "Configuration: ~/.claude/hud-config.json"
echo "  - Run: hud-config preset full"
echo "  - Run: hud-config preset minimal"
echo "  - Run: hud-config items model,context,speed"
echo ""
