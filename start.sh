#!/bin/bash

set -e

echo "========================================="
echo "  长租公寓保洁排班跟进台 - 启动脚本"
echo "========================================="

echo ""
echo "[1/4] 启动数据库和 Redis 服务..."
docker compose up -d

echo ""
echo "[2/4] 安装后端依赖..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || true
pip install -q -r requirements.txt

echo ""
echo "[3/4] 初始化数据库和示例数据..."
python3 init_db.py

echo ""
echo "[4/4] 启动后端 API 服务..."
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo ""
echo "后端服务已启动: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"

cd ../frontend

echo ""
echo "[5/5] 安装前端依赖并启动..."
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install --silent
fi

echo "正在启动前端开发服务器..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  启动完成!"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo ""
echo "  演示账号:"
echo "    管理员: admin / admin123"
echo "    主管: supervisor1 / super123"
echo "    保洁员: cleaner1 / clean123"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "========================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose down; exit" INT TERM EXIT

wait
