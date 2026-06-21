#!/bin/bash

echo "🚀 启动法律服务费用报价跟进台"
echo ""

echo "📦 启动 PostgreSQL 和 Redis..."
docker-compose up -d

sleep 3

echo "🐍 安装后端依赖..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]" -q

echo "🗄️  初始化数据库..."
python scripts/init_db.py

echo ""
echo "✅ 后端启动在 http://localhost:8000"
echo "📖 API 文档: http://localhost:8000/docs"

cd ..

echo ""
echo "📱 安装前端依赖..."
cd frontend
npm install --silent

echo ""
echo "✅ 前端启动在 http://localhost:5173"
echo ""

echo "============================================"
echo " 法律服务费用报价跟进台 启动完成!"
echo "============================================"
echo ""
echo "后端 (另开终端):"
echo "  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "前端 (另开终端):"
echo "  cd frontend && npm run dev"
echo ""
