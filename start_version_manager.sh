#!/bin/bash

cd "$(dirname "$0")"

echo "📊 转化率口径版本管理"
echo "=============================="

if [ ! -d ".venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv .venv
fi

echo "🔧 激活虚拟环境..."
source .venv/bin/activate

echo "📚 安装依赖..."
pip install -r requirements.txt

echo "🚀 启动版本管理应用..."
streamlit run src/pages/version_manager.py --server.port 8502
