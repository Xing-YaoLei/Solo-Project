#!/bin/bash

echo "🚀 启动商户结算趋势看板后端服务..."

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

echo "🐍 激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt -q

echo "🌐 启动 FastAPI 服务 (端口: 8000)..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
