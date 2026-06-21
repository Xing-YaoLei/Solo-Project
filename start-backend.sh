#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo "=========================================="
echo "  商户结算趋势看板 - 后端服务启动"
echo "=========================================="
echo ""

cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv "$VENV_DIR"
fi

echo "🐍 激活虚拟环境..."
source "$VENV_DIR/bin/activate"

echo "📦 安装/检查 Python 依赖..."
pip install -r "$BACKEND_DIR/requirements.txt" -q

echo ""
echo "🚀 启动 FastAPI 服务 (http://localhost:8000)..."
echo "📖 API 文档: http://localhost:8000/docs"
echo ""

exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
