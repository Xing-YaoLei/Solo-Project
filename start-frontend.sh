#!/bin/bash

echo "🎨 启动商户结算趋势看板前端服务..."

cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

echo "🌐 启动开发服务器 (端口: 3000)..."
npm run dev
