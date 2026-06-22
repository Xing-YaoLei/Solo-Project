#!/bin/bash
set -e

echo "=================================================="
echo "  合规审计制度检查排程台 - 前端启动脚本"
echo "=================================================="

cd "$(dirname "$0")/src/ComplianceAudit.Web"

if [ ! -d "node_modules" ]; then
  echo "[1/2] 首次安装 npm 依赖..."
  npm install
fi

echo ""
echo "[2/2] 启动 Vite 开发服务器 (http://localhost:5173)"
echo ""

npm run dev
