#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=========================================="
echo "  商户结算趋势看板 - 前端服务启动"
echo "=========================================="
echo ""

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo ""
echo "� 启动 Vite 开发服务器 (http://localhost:3000)..."
echo ""

npm run dev
