#!/bin/bash
set -e

echo "=== 景区运营门票预约趋势看板 - 启动脚本 ==="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env" ]; then
    echo "复制 .env.example 到 .env，请根据实际环境修改"
    cp .env.example .env
fi

echo "初始化数据库和种子数据..."
python scripts/init_db.py setup

echo "启动 Celery Worker..."
celery -A ticket_dashboard.tasks.celery_app:celery_app worker --loglevel=info &
CELERY_PID=$!

echo "启动 Celery Beat..."
celery -A ticket_dashboard.tasks.celery_app:celery_app beat --loglevel=info &
BEAT_PID=$!

echo "启动 Dash 看板服务..."
python app.py &
DASH_PID=$!

echo ""
echo "=== 服务已启动 ==="
echo "Dash 看板: http://localhost:8050"
echo "Celery Worker PID: $CELERY_PID"
echo "Celery Beat PID: $BEAT_PID"
echo "Dash PID: $DASH_PID"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $CELERY_PID $BEAT_PID $DASH_PID 2>/dev/null; exit" INT TERM

wait
