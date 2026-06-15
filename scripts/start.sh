#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "============================================="
echo "职业教育在线课程漏斗报表系统"
echo "============================================="

echo ""
echo "请选择操作:"
echo "1. 初始化数据库 (首次运行)"
echo "2. 生成示例数据"
echo "3. 启动仪表盘"
echo "4. 启动Celery Worker"
echo "5. 一键启动 (数据库+示例数据+仪表盘"
echo "6. 全部操作"
echo ""

read -p "请输入选项 [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "正在初始化数据库..."
        python scripts/init_db.py
        echo "数据库初始化完成！"
        ;;
    2)
        echo ""
        echo "正在生成示例数据..."
        python scripts/generate_sample_data.py
        echo "示例数据生成完成！"
        ;;
    3)
        echo ""
        echo "正在启动仪表盘..."
        echo "早会快速访问: http://localhost:8050/"
        echo ""
        python run.py
        ;;
    4)
        echo ""
        echo "正在启动Celery Worker..."
        celery -A app.sync worker --loglevel=info --beat
        ;;
    5)
        echo ""
        echo "正在执行一键启动..."
        echo ""
        echo "1. 初始化数据库..."
        python scripts/init_db.py
        echo ""
        echo "2. 生成示例数据..."
        python scripts/generate_sample_data.py
        echo ""
        echo "3. 启动仪表盘..."
        echo "早会快速访问: http://localhost:8050/"
        echo ""
        python run.py
        ;;
    6)
        echo ""
        echo "正在执行全部操作..."
        echo ""
        echo "1. 初始化数据库..."
        python scripts/init_db.py
        echo ""
        echo "2. 生成示例数据..."
        python scripts/generate_sample_data.py
        echo ""
        echo "3. 启动仪表盘..."
        echo "早会快速访问: http://localhost:8050/"
        echo ""
        python run.py
        ;;
    *)
        echo "无效选项，请重新运行脚本。"
        exit 1
        ;;
esac
