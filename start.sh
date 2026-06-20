#!/usr/bin/env bash
# 启动脚本 - 景区门票预约漏斗报表系统

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[INFO] 已复制 .env.example 为 .env, 请根据需要修改配置"
fi

PYTHON_BIN="${PYTHON_BIN:-python3}"

case "$1" in
    install)
        echo "[1/2] 安装 Python 依赖..."
        $PYTHON_BIN -m pip install -r requirements.txt
        echo "[2/2] 依赖安装完成"
        ;;

    init-db)
        echo "[1/1] 初始化数据库..."
        $PYTHON_BIN scripts/init_db.py
        ;;

    mock-data)
        echo "[1/1] 生成模拟数据 (14天)..."
        $PYTHON_BIN scripts/generate_mock_data.py
        ;;

    worker)
        echo "[1/1] 启动 Celery Worker..."
        celery -A tasks.celery_app.celery_app worker --loglevel=info -Q default --concurrency=4
        ;;

    beat)
        echo "[1/1] 启动 Celery Beat..."
        celery -A tasks.celery_app.celery_app beat --loglevel=info
        ;;

    dashboard)
        echo "[1/1] 启动 Dash 仪表盘..."
        $PYTHON_BIN app/app.py
        ;;

    all)
        echo "[INFO] 请先确保 PostgreSQL 和 Redis 已启动"
        echo "[1/3] 初始化数据库..."
        $PYTHON_BIN scripts/init_db.py
        echo "[2/3] 生成模拟数据..."
        $PYTHON_BIN scripts/generate_mock_data.py
        echo "[3/3] 启动仪表盘..."
        $PYTHON_BIN app/app.py
        ;;

    help|*)
        echo "景区门票预约漏斗报表系统 - 启动脚本"
        echo ""
        echo "用法: $0 <命令>"
        echo ""
        echo "可用命令:"
        echo "  install      安装 Python 依赖"
        echo "  init-db      初始化数据库表和默认用户"
        echo "  mock-data    生成 14 天模拟数据"
        echo "  worker       启动 Celery Worker (数据加工)"
        echo "  beat         启动 Celery Beat (定时任务调度)"
        echo "  dashboard    启动 Dash 仪表盘 (默认端口 8050)"
        echo "  all          一键初始化 + 启动仪表盘"
        echo "  help         显示此帮助"
        echo ""
        echo "启动顺序建议:"
        echo "  1. 启动 PostgreSQL & Redis"
        echo "  2. $0 install"
        echo "  3. $0 init-db"
        echo "  4. $0 mock-data   # 可选"
        echo "  5. $0 worker      # 另开终端"
        echo "  6. $0 dashboard   # 主服务"
        ;;
esac
