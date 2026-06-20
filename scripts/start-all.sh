#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "=============================================="
echo " 一键启动 活动票务赞助权益风险监测系统"
echo "=============================================="

cleanup() {
  echo ""
  echo "🛑 正在停止服务..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null
  echo "✅ 服务已停止"
  exit 0
}
trap cleanup INT TERM EXIT

echo "[1/2] 🚀 启动后端 FastAPI (port 8000)..."
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
  echo "  → 创建虚拟环境并安装依赖（首次启动较慢）..."
  python3 -m venv venv
  source venv/bin/activate
  pip install --upgrade pip >/dev/null
  pip install -r requirements.txt >/dev/null 2>&1
else
  source venv/bin/activate
fi
mkdir -p logs data
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > "$BACKEND_DIR/logs/uvicorn.log" 2>&1 &
BACKEND_PID=$!
echo "  ✅ 后端 PID $BACKEND_PID | 文档: http://localhost:8000/docs"

# 等待后端就绪
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "[2/2] 🎨 启动前端 Vite Dev Server (port 5173)..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "  → 安装 npm 依赖（首次启动较慢）..."
  npm install >/dev/null 2>&1
fi
npm run dev > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo "  ✅ 前端 PID $FRONTEND_PID | 页面: http://localhost:5173"

echo ""
echo "===================================================="
echo " ✨ 全部服务启动成功！"
echo " 🖥️   前端大屏地址:  http://localhost:5173"
echo " ⚙️   后端 API 文档:  http://localhost:8000/docs"
echo " 📝  后端日志:       $BACKEND_DIR/logs/uvicorn.log"
echo " 🛑  按 Ctrl + C 停止所有服务"
echo "===================================================="

wait
