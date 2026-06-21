#!/bin/bash

echo "=== 即时下单漏斗报表看板启动脚本 ==="

case "$1" in
    install)
        echo "正在安装依赖..."
        pip install -r requirements.txt
        echo "依赖安装完成"
        ;;

    init-db)
        echo "正在初始化数据库和默认数据..."
        export PYTHONPATH=$(pwd)
        python init_db.py
        echo "数据库初始化完成"
        ;;

    seed-data)
        echo "数据已在 init-db 中初始化完成"
        ;;

    worker)
        echo "启动 Celery Worker..."
        celery -A celery_app.celery_app worker --loglevel=info -c 2
        ;;

    beat)
        echo "启动 Celery Beat..."
        celery -A celery_app.celery_app beat --loglevel=info
        ;;

    web)
        echo "启动 Dash Web 服务..."
        export PYTHONPATH=$(pwd)
        python app.py
        ;;

    all)
        echo "启动所有服务..."
        echo "请确保 PostgreSQL 和 Redis 已启动"
        echo "启动 Celery Worker (后台)..."
        celery -A celery_app.celery_app worker --loglevel=info -c 2 &
        WORKER_PID=$!
        echo "启动 Dash Web 服务..."
        export PYTHONPATH=$(pwd)
        python app.py
        kill $WORKER_PID 2>/dev/null
        ;;

    *)
        echo "用法: $0 {install|init-db|seed-data|worker|beat|web|all}"
        echo ""
        echo "命令说明:"
        echo "  install    - 安装 Python 依赖"
        echo "  init-db    - 初始化数据库表结构"
        echo "  seed-data  - 生成模拟数据（含异常检测和赔付计算）"
        echo "  worker     - 启动 Celery Worker 进程"
        echo "  beat       - 启动 Celery Beat 定时任务"
        echo "  web        - 启动 Dash Web 看板"
        echo "  all        - 启动 Worker 和 Web 服务"
        ;;
esac
