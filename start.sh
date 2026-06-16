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
echo "  2) 启动 Celery Worker (单Worker消费所有队列)"
echo "  3) 启动 Celery Worker (同步队列 sync_queue)"
echo "  4) 启动 Celery Worker (监测队列 monitor_queue - HIS延迟/影像缺失/收费口径)"
echo "  5) 启动 Celery Worker (分析队列 analytics_queue)"
echo "  6) 仅启动 Celery Beat"
echo "  7) 启动全部服务 (开发环境简化版)"
echo "  8) 填充示例测试数据"
echo "  9) 创建数据库表结构"
echo ""
read -p "请选择启动模式 [1-9]: " choice

case $choice in
    1)
        echo "启动 Dash 看板..."
        python run_dashboard.py
        ;;
    2)
        echo "启动 Celery Worker (消费所有队列)..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue,monitor_queue,analytics_queue -n worker_all@%h
        ;;
    3)
        echo "启动 Celery Worker (同步队列 sync_queue)..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue -n worker_sync@%h --concurrency=2
        ;;
    4)
        echo "启动 Celery Worker (监测队列 monitor_queue)..."
        echo "消费: HIS延迟检测、影像缺失检测、收费口径变化检测"
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q monitor_queue -n worker_monitor@%h --concurrency=4
        ;;
    5)
        echo "启动 Celery Worker (分析队列 analytics_queue)..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q analytics_queue -n worker_analytics@%h --concurrency=2
        ;;
    6)
        echo "启动 Celery Beat..."
        celery -A celery_tasks.beat_config beat --loglevel=info
        ;;
    7)
        echo "启动全部服务 (开发环境简化版)..."
        echo "⚠️  生产环境建议使用 supervisor/systemd 分别管理各服务"
        echo ""
        echo "启动 Redis (请确保已安装)..."
        redis-server --daemonize yes || true
        echo "启动 Celery Worker (单Worker消费所有队列)..."
        celery -A celery_tasks.app.celery_app worker --loglevel=info -Q sync_queue,monitor_queue,analytics_queue -n worker_all@%h --detach --logfile=./logs/worker.log
        echo "启动 Celery Beat..."
        celery -A celery_tasks.beat_config beat --loglevel=info --detach --logfile=./logs/beat.log
        echo "创建日志目录..."
        mkdir -p ./logs
        echo "启动 Dash 看板..."
        python run_dashboard.py
        ;;
    8)
        echo "填充示例数据..."
        python scripts/generate_sample_data.py
        ;;
    9)
        echo "创建数据库表结构..."
        python scripts/init_db.py
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac
