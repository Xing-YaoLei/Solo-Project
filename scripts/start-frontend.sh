#!/bin/bash

echo "========================================"
echo "  养老护理床位排班排程台 - 启动前端"
echo "========================================"
echo ""

cd "$(dirname "$0")/../src/client"

echo "[1/3] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js 18+"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js 版本：$(node --version)"
echo "✅ npm 版本：$(npm --version)"

echo ""
echo "[2/3] 安装依赖包..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "📦 依赖已存在，跳过安装"
fi

echo ""
echo "[3/3] 启动前端开发服务器..."
echo ""
echo "🌐 前端地址：http://localhost:3000"
echo "🔌 API 代理：/api -> http://localhost:5000"
echo ""

npm run dev
