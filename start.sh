#!/bin/bash

cd "$(dirname "$0")"

echo "🏨 旅游民宿套餐售卖趋势看板"
echo "=============================="

if [ ! -d ".venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv .venv
fi

echo "🔧 激活虚拟环境..."
source .venv/bin/activate

echo "📚 安装依赖..."
pip install -r requirements.txt

echo "🚀 启动 Streamlit 应用..."
streamlit run app.py --server.port 8501
