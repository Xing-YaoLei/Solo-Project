#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 启动合规审计制度检查跟进台开发环境"
echo "📁 项目根目录: $PROJECT_ROOT"
echo ""

echo "🔧 启动 PostgreSQL & Redis (Docker Compose)"
cd "$PROJECT_ROOT"
docker compose up -d

echo ""
echo "⏳ 等待数据库就绪..."
sleep 5

echo ""
echo "📦 安装后端依赖..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "📁 创建必要目录..."
mkdir -p uploads exports

echo ""
echo "⚙️  配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已从 .env.example 创建 .env 文件"
fi

echo ""
echo "🚀 启动 FastAPI 后端服务 (端口 8000)..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

echo ""
echo "🚀 启动前端开发服务 (端口 5173)..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

echo ""
echo "✅ 所有服务已启动！"
echo "🌐 前端地址: http://localhost:5173"
echo "📖 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose down; echo '👋 服务已停止'" EXIT

wait
