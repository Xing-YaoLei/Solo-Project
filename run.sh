#!/bin/bash

echo "🏗️  家装工地客户确认风险监测系统"
echo "================================"
echo ""

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR"

echo "📂 工作目录: $BASE_DIR"
echo ""

if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ 创建虚拟环境失败，请手动执行: python3 -m venv venv"
        exit 1
    fi
    echo "✅ 虚拟环境创建完成"
fi

echo "🔧 激活虚拟环境..."
source venv/bin/activate

echo "📚 检查/安装依赖..."
pip install -q -r requirements.txt 2>&1 | tail -5
echo "✅ 依赖检查完成"

if [ ! -f "./data/home_decoration.duckdb" ]; then
    echo ""
    echo "📊 初始化数据..."
    python init_data.py
    if [ $? -ne 0 ]; then
        echo "⚠️  数据初始化出现警告，尝试继续启动..."
    fi
else
    echo "✅ 数据库已存在: ./data/home_decoration.duckdb"
fi

echo ""
echo "🚀 启动 Streamlit 应用..."
echo "📱 访问地址: http://localhost:8501"
echo "💡 按 Ctrl+C 停止服务"
echo ""

streamlit run app.py \
    --server.port 8501 \
    --server.address 0.0.0.0 \
    --server.headless true \
    --browser.gatherUsageStats false
