#!/usr/bin/env bash
# WeatherEscape — quick start for macOS / Linux
# Usage: ./start.sh   (from any directory)

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "WeatherEscape — setup & run"

if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install || { echo "npm install failed. Is Node.js 18+ installed?"; exit 1; }
fi

echo "Starting dev server at http://localhost:5173"
npm run dev
