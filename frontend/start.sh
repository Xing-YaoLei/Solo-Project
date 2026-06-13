#!/bin/bash
set -e

echo "=== 启动前端开发服务器 ==="
echo ""

if [ ! -d "node_modules" ]; then
    echo "📦 未找到 node_modules，正在安装依赖..."
    npm install
fi

echo ""
echo "🚀 启动Vite开发服务器..."
echo "前端地址: http://localhost:3000"
echo "后端代理: http://localhost:8000"
echo ""
exec npm run dev
