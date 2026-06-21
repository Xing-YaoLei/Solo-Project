#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PACKAGE_JSON="$FRONTEND_DIR/package.json"

echo "=========================================="
echo "  商户结算趋势看板 - 前端服务启动"
echo "=========================================="
echo ""
echo "项目目录: $SCRIPT_DIR"
echo "前端目录: $FRONTEND_DIR"
echo ""

cd "$FRONTEND_DIR"

if [ ! -f "$PACKAGE_JSON" ]; then
    echo "❌ 未找到 package.json: $PACKAGE_JSON"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm 命令，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "📦 Node 版本: $(node --version)"
echo "📦 npm 版本: $(npm --version)"
echo ""

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    if ! npm install; then
        echo "❌ 依赖安装失败，请检查网络或 package.json"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

echo ""
echo "🚀 启动 Vite 开发服务器 (http://localhost:3000)..."
echo "💡 按 Ctrl+C 停止服务"
echo ""

npm run dev
