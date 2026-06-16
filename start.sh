#!/bin/bash

set -e

echo "=============================================="
echo "  🦷 口腔诊所洁牙预约风险监测系统 - 启动脚本"
echo "=============================================="
echo ""

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR"

if [ ! -d "venv" ]; then
    echo "[1/5] 创建Python虚拟环境..."
    python3 -m venv venv
fi

echo "[2/5] 激活虚拟环境..."
source venv/bin/activate

echo "[3/5] 安装依赖..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "[4/5] 复制环境变量配置..."
    cp .env.example .env
    echo "  ⚠️  请编辑 .env 文件配置实际的数据库和API连接信息"
else
    echo "[4/5] 环境变量配置已存在"
fi

echo "[5/5] 启动服务..."
echo ""
echo "启动选项:"
echo "  1) 仅启动看板 (Dash)"
echo "  2) 仅启动 Celery Worker"
echo "  3) 仅启动 Celery Beat"
echo "  4) 启动全部服务"
echo "  5) 填充示例测试数据"
echo "  6) 创建数据库表结构"
echo ""
read -p "请选择启动模式 [1-6]: " choice

case $choice in
    1)
        echo "启动 Dash 看板..."
        python run_dashboard.py
        ;;
    2)
        echo "启动 Celery Worker..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue,monitor_queue,analytics_queue
        ;;
    3)
        echo "启动 Celery Beat..."
        celery -A celery_tasks.beat_config beat --loglevel=info
        ;;
    4)
        echo "启动全部服务..."
        echo "⚠️  生产环境建议使用 supervisor/systemd 分别管理各服务"
        echo ""
        echo "启动 Redis (请确保已安装)..."
        redis-server --daemonize yes || true
        echo "启动 Celery Worker..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue,monitor_queue,analytics_queue --detach
        echo "启动 Celery Beat..."
        celery -A celery_tasks.beat_config beat --loglevel=info --detach
        echo "启动 Dash 看板..."
        python run_dashboard.py
        ;;
    5)
        echo "填充示例数据..."
        python scripts/generate_sample_data.py
        ;;
    6)
        echo "创建数据库表结构..."
        python scripts/init_db.py
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac
