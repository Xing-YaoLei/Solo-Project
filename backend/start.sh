#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo " 启动活动票务赞助权益风险监测系统 - 后端 API"
echo "=============================================="

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "[1/3] 首次启动，创建 Python 虚拟环境..."
  python3 -m venv venv
fi

source venv/bin/activate

if ! venv/bin/pip list 2>/dev/null | grep -q "^fastapi "; then
  echo "[2/3] 安装 Python 依赖..."
  pip install --upgrade pip
  pip install -r requirements.txt
fi

echo "[3/3] 确保数据目录存在..."
mkdir -p logs data

echo ""
echo "✅ 后端服务启动中..."
echo "📡 API 地址:  http://localhost:8000"
echo "📖 文档地址:  http://localhost:8000/docs"
echo "💾 DuckDB 文件: $BACKEND_DIR/data/analytics.duckdb"
echo ""
echo "Ctrl + C 停止服务"
echo ""

cd "$BACKEND_DIR"
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
