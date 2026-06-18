#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== 汽车维修预约跟踪系统 - 开发环境启动 ==="

if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "[1/7] 启动 PostgreSQL 和 Redis..."
docker compose up -d postgres redis

echo "[2/7] 等待 PostgreSQL 就绪..."
until docker compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL 已就绪"

echo "[3/7] 准备后端虚拟环境..."
if [ ! -d "backend/.venv" ]; then
    python3 -m venv backend/.venv
fi
source backend/.venv/bin/activate
pip install -q -r backend/requirements.txt

echo "[4/7] 运行数据库迁移..."
cd backend
alembic upgrade head
cd ..

echo "[5/7] 启动后端服务..."
source backend/.venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

echo "[6/7] 启动 Celery Worker..."
cd backend
celery -A app.tasks.celery_app worker --loglevel=info &
CELERY_PID=$!
cd ..

echo "[7/7] 启动前端开发服务器..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== 启动完成 ==="
echo "后端 API:    http://localhost:8000"
echo "前端界面:    http://localhost:5173"
echo "PostgreSQL:  localhost:5432"
echo "Redis:       localhost:6379"
echo ""
echo "按 Ctrl+C 停止所有服务"

cleanup() {
    echo "正在停止服务..."
    kill $FRONTEND_PID $CELERY_PID $BACKEND_PID 2>/dev/null || true
    docker compose stop
    echo "已停止"
}
trap cleanup EXIT INT TERM

wait
