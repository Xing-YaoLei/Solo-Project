#!/bin/bash

# 后端本地开发启动脚本

set -e

cd "$(dirname "$0")/../backend"

echo "================================================"
echo "  后端本地开发模式"
echo "================================================"
echo ""

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt

echo ""
echo "🚀 启动 FastAPI 服务 (端口: 8000)..."
echo "   API文档: http://localhost:8000/docs"
echo "   按 Ctrl+C 停止服务"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
