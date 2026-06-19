#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "旅游民宿房态管理趋势看板 - 启动脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  install      安装Python依赖"
    echo "  init-db      初始化数据库表结构"
    echo "  seed-data    生成模拟数据"
    echo "  worker       启动Celery Worker"
    echo "  beat         启动Celery Beat定时任务"
    echo "  app          启动Dash看板应用"
    echo "  all          启动全部服务(Worker + App)"
    echo "  help         显示此帮助信息"
    echo ""
    echo "环境变量: 请复制 .env.example 为 .env 并配置数据库连接"
}

check_env() {
    if [ ! -f ".env" ]; then
        echo "⚠️  未找到 .env 文件，正在从 .env.example 创建..."
        cp .env.example .env
        echo "请编辑 .env 文件配置正确的数据库连接信息后再继续"
        echo ""
    fi
}

case "${1:-help}" in
    install)
        echo "📦 安装Python依赖..."
        pip install -r requirements.txt
        echo "✅ 依赖安装完成"
        ;;

    init-db)
        check_env
        echo "🗄️  初始化数据库..."
        python scripts/init_db.py
        echo "✅ 数据库初始化完成"
        ;;

    seed-data)
        check_env
        echo "🎲 生成模拟数据..."
        python scripts/seed_data.py
        echo "✅ 模拟数据生成完成"
        ;;

    worker)
        check_env
        echo "👷 启动Celery Worker..."
        celery -A tasks.celery_app worker --loglevel=info --pool=solo
        ;;

    beat)
        check_env
        echo "⏰ 启动Celery Beat定时任务..."
        celery -A tasks.celery_app beat --loglevel=info
        ;;

    app)
        check_env
        echo "🚀 启动Dash看板应用..."
        echo "访问地址: http://localhost:8050"
        python app.py
        ;;

    all)
        check_env
        echo "🚀 启动全部服务..."
        echo "启动Celery Worker (后台)..."
        celery -A tasks.celery_app worker --loglevel=info --pool=solo &
        WORKER_PID=$!
        echo "Worker PID: $WORKER_PID"

        echo "启动Dash应用..."
        echo "访问地址: http://localhost:8050"
        python app.py

        echo "正在停止Worker..."
        kill $WORKER_PID 2>/dev/null || true
        ;;

    help|*)
        show_help
        ;;
esac
