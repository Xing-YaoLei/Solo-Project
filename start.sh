#!/bin/bash

echo "🏥 康复中心康复评估风险监测系统"
echo "========================================"

if [ ! -f "rehab_center.db" ]; then
    echo "📦 首次运行，初始化数据库..."
    python scripts/init_database.py
    echo ""
    echo "🎲 生成模拟数据..."
    python scripts/mock_data_generator.py
    echo ""
fi

echo "🚀 启动Dash应用..."
python run.py
