#!/bin/bash

echo "=== 启动前端服务 ==="

cd "$(dirname "$0")"

echo "安装依赖..."
npm install

echo "启动开发服务器..."
npm run dev
