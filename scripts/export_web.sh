#!/bin/bash
set -e

GODOT_CMD=""
if command -v godot &> /dev/null; then
    GODOT_CMD="godot"
elif command -v godot4 &> /dev/null; then
    GODOT_CMD="godot4"
elif [ -f "/Applications/Godot.app/Contents/MacOS/Godot" ]; then
    GODOT_CMD="/Applications/Godot.app/Contents/MacOS/Godot"
else
    echo "Error: Godot not found"
    echo "Install: brew install --cask godot"
    echo "Or download: https://godotengine.org/download"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$PROJECT_DIR/build/web"

echo "=== Coffee Loss Review Training Game - Web Export ==="
echo "Godot: $GODOT_CMD"
echo "Project: $PROJECT_DIR"
echo "Output: $BUILD_DIR"
echo ""

mkdir -p "$BUILD_DIR"

echo "[1/2] Exporting Web release..."
cd "$PROJECT_DIR"
"$GODOT_CMD" --headless --export-release "Web" "$BUILD_DIR/index.html" 2>&1 || {
    echo ""
    echo "Export failed. Possible fixes:"
    echo "  1. Open Godot Editor -> Editor -> Manage Export Templates -> Install"
    echo "  2. Then re-run this script"
    exit 1
}

echo "[2/2] Verifying output..."
if [ -f "$BUILD_DIR/index.html" ]; then
    echo "Success! Files generated:"
    ls -la "$BUILD_DIR"
    echo ""
    echo "To preview locally:"
    echo "  cd $BUILD_DIR && python3 -m http.server 8080"
    echo "  Then open http://localhost:8080"
else
    echo "Error: index.html not found after export"
    exit 1
fi
