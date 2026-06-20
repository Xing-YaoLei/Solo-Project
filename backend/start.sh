#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo " 启动活动票务赞助权益风险监测系统 - 后端 API"
echo "=============================================="

cd "$PROJECT_DIR"

if [ ! -d "venv" ]; then
  echo "[1/2] 首次启动，创建 Python 虚拟环境..."
  python3 -m venv venv
fi

source venv/bin/activate

if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "[2/2] 安装 Python 依赖..."
  pip install --upgrade pip
  pip install -r requirements.txt
fi

mkdir -p logs data

echo ""
echo "✅ 后端服务启动中..."
echo "📡 API 地址:  http://localhost:8000"
echo "📖 文档地址:  http://localhost:8000/docs"
echo "💾 DuckDB 文件: ./backend/data/analytics.duckdb"
echo ""
echo "Ctrl + C 停止服务"
echo ""

uvicorn app.main:app --app-dir "$PROJECT_DIR" --reload --port 8000 --host 0.0.0.0
