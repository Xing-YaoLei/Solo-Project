#!/bin/bash

# 前端本地开发启动脚本

set -e

cd "$(dirname "$0")/../frontend"

echo "================================================"
echo "  前端本地开发模式"
echo "================================================"
echo ""

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo ""
echo "🚀 启动 React 开发服务器 (端口: 3000)..."
echo "   访问地址: http://localhost:3000"
echo "   按 Ctrl+C 停止服务"
echo ""

npm start
