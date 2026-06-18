#!/bin/bash
cd "$(dirname "$0")"
export PYTHONPATH="$(pwd)"

if [ ! -d "venv" ]; then
    echo "📦 虚拟环境不存在，正在创建 venv..."
    python3 -m venv venv
    echo "✓ 虚拟环境创建完成"
fi

source venv/bin/activate

echo "📚 检查并安装依赖..."
pip install -q -r requirements.txt
echo "✓ 依赖安装完成"

echo ""
echo "🚀 启动后端服务..."
echo "   地址: http://localhost:8000"
echo "   文档: http://localhost:8000/docs"
echo "   用户: admin / admin123"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
