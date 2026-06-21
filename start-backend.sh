#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"
REQUIREMENTS_FILE="$BACKEND_DIR/requirements.txt"

echo "=========================================="
echo "  商户结算趋势看板 - 后端服务启动"
echo "=========================================="
echo ""
echo "项目目录: $SCRIPT_DIR"
echo "后端目录: $BACKEND_DIR"
echo ""

cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
    echo "📦 创建 Python 虚拟环境..."
    if ! python3 -m venv "$VENV_DIR"; then
        echo "❌ 创建虚拟环境失败，请检查 Python3 是否安装"
        exit 1
    fi
    echo "✅ 虚拟环境创建成功"
else
    echo "✅ 虚拟环境已存在"
fi

echo "🐍 激活虚拟环境..."
source "$VENV_DIR/bin/activate"

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo "❌ 未找到 requirements.txt: $REQUIREMENTS_FILE"
    exit 1
fi

echo "📦 安装/检查 Python 依赖..."
pip install --upgrade pip -q
if ! pip install -r "$REQUIREMENTS_FILE" -q; then
    echo "❌ 依赖安装失败，请检查网络或 requirements.txt"
    exit 1
fi
echo "✅ 依赖安装完成"

echo ""
echo "🚀 启动 FastAPI 服务 (http://localhost:8000)..."
echo "📖 API 文档: http://localhost:8000/docs"
echo "💡 按 Ctrl+C 停止服务"
echo ""

exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
