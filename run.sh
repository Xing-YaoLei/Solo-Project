#!/bin/bash
set -e

echo "🏗️  家装工地客户确认风险监测系统"
echo "================================"

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR"

if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

echo "🔧 激活虚拟环境..."
source venv/bin/activate

echo "📚 安装依赖..."
pip install -q -r requirements.txt

if [ ! -f "./data/home_decoration.duckdb" ]; then
    echo "📊 初始化数据..."
    python init_data.py
else
    echo "✅ 数据库已存在，跳过初始化"
fi

echo ""
echo "🚀 启动 Streamlit 应用..."
echo "📱 访问地址：http://localhost:8501"
echo ""

streamlit run app.py --server.port 8501 --server.address 0.0.0.0
