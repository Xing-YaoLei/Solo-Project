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
        $PYTHON_BIN -m pip install --upgrade pip
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
        celery -A tasks.celery_app.celery_app worker --loglevel=info --concurrency=4 --pool=solo
        ;;

    worker-bg)
        echo "[1/1] 后台启动 Celery Worker..."
        nohup celery -A tasks.celery_app.celery_app worker --loglevel=info --concurrency=4 --pool=solo > logs/celery_worker.log 2>&1 &
        WORKER_PID=$!
        echo "Celery Worker 已启动, PID: $WORKER_PID"
        echo "日志文件: logs/celery_worker.log"
        echo $WORKER_PID > logs/celery_worker.pid
        ;;

    beat)
        echo "[1/1] 启动 Celery Beat..."
        celery -A tasks.celery_app.celery_app beat --loglevel=info
        ;;

    dashboard)
        echo "[1/1] 启动 Dash 仪表盘..."
        $PYTHON_BIN app/app.py
        ;;

    dashboard-bg)
        mkdir -p logs
        echo "[1/1] 后台启动 Dash 仪表盘..."
        nohup $PYTHON_BIN app/app.py > logs/dashboard.log 2>&1 &
        DASH_PID=$!
        echo "Dash 仪表盘已启动, PID: $DASH_PID"
        echo "日志文件: logs/dashboard.log"
        echo "访问: http://localhost:8050"
        echo $DASH_PID > logs/dashboard.pid
        ;;

    standalone)
        echo "=============================================="
        echo " STANDALONE 模式 (SQLite + 同步执行, 无需 PostgreSQL/Redis)"
        echo "=============================================="
        echo ""
        echo "[1/4] 检查并安装依赖..."
        $PYTHON_BIN -m pip install -q -r requirements.txt 2>&1 | tail -5
        echo "[2/4] 初始化数据库..."
        $PYTHON_BIN scripts/init_db.py
        echo "[3/4] 生成 14 天模拟数据 (摄像头+闸机+商户+漏斗合并)..."
        $PYTHON_BIN scripts/generate_mock_data.py
        echo "[4/4] 启动 Dash 仪表盘..."
        echo ""
        echo "默认测试账号:"
        echo "  管理层  admin  / admin123"
        echo "  一线人员 staff / staff123"
        echo "  一线人员 staff2 / staff123"
        echo ""
        $PYTHON_BIN app/app.py
        ;;

    quickstart)
        echo "[INFO] 快速启动模式 - 先尝试 STANDALONE, 失败再提示"
        mkdir -p logs
        bash "$0" standalone
        ;;

    stop)
        echo "[1/2] 停止 Dash 仪表盘..."
        if [ -f logs/dashboard.pid ]; then
            DASH_PID=$(cat logs/dashboard.pid)
            if kill -0 $DASH_PID 2>/dev/null; then
                kill $DASH_PID
                echo "已停止 Dash (PID: $DASH_PID)"
            else
                echo "Dash 未运行"
            fi
            rm -f logs/dashboard.pid
        else
            echo "未发现 Dash 运行记录"
        fi
        echo "[2/2] 停止 Celery Worker..."
        if [ -f logs/celery_worker.pid ]; then
            WORKER_PID=$(cat logs/celery_worker.pid)
            if kill -0 $WORKER_PID 2>/dev/null; then
                kill $WORKER_PID
                echo "已停止 Celery Worker (PID: $WORKER_PID)"
            else
                echo "Celery Worker 未运行"
            fi
            rm -f logs/celery_worker.pid
        else
            echo "未发现 Celery Worker 运行记录"
        fi
        pkill -f "celery -A tasks" 2>/dev/null || true
        pkill -f "python3 app/app.py" 2>/dev/null || true
        echo "停止完成"
        ;;

    status)
        echo "服务状态:"
        if pgrep -f "python3 app/app.py" > /dev/null; then
            echo "  ✅ Dash 仪表盘: 运行中 (PID: $(pgrep -f 'python3 app/app.py'))"
        else
            echo "  ❌ Dash 仪表盘: 未运行"
        fi
        if pgrep -f "celery -A tasks" > /dev/null; then
            echo "  ✅ Celery Worker: 运行中 (PID: $(pgrep -f 'celery -A tasks'))"
        else
            echo "  ❌ Celery Worker: 未运行"
        fi
        if command -v redis-cli >/dev/null 2>&1 && redis-cli ping 2>/dev/null | grep -q PONG; then
            echo "  ✅ Redis: 运行中"
        else
            echo "  ⚠️  Redis: 未检测到 (STANDALONE 模式可忽略)"
        fi
        if command -v pg_isready >/dev/null 2>&1 && pg_isready -q 2>/dev/null; then
            echo "  ✅ PostgreSQL: 运行中"
        else
            echo "  ⚠️  PostgreSQL: 未检测到 (STANDALONE 模式可忽略)"
        fi
        if [ -f data/scenic_ticket.db ]; then
            echo "  🗄️  SQLite 数据库: data/scenic_ticket.db  ($(du -h data/scenic_ticket.db | cut -f1))"
        fi
        ;;

    help|*)
        echo "景区门票预约漏斗报表系统 - 启动脚本"
        echo ""
        echo "用法: $0 <命令>"
        echo ""
        echo "⭐ 推荐命令 (无需外部服务):"
        echo "  standalone   一键 STANDALONE 模式: 安装依赖+初始化+生成模拟数据+启动仪表盘"
        echo "               (使用 SQLite, 同步执行, 不需要 PostgreSQL/Redis)"
        echo "  quickstart   快速启动 (等同 standalone)"
        echo ""
        echo "标准命令 (需要 PostgreSQL + Redis):"
        echo "  install      安装 Python 依赖"
        echo "  init-db      初始化数据库表和默认用户"
        echo "  mock-data    生成 14 天模拟数据"
        echo "  worker       启动 Celery Worker (数据加工)"
        echo "  worker-bg    后台启动 Celery Worker"
        echo "  beat         启动 Celery Beat (定时任务调度)"
        echo "  dashboard    启动 Dash 仪表盘 (默认端口 8050)"
        echo "  dashboard-bg 后台启动 Dash 仪表盘"
        echo ""
        echo "管理命令:"
        echo "  stop         停止所有服务"
        echo "  status       查看服务运行状态"
        echo "  help         显示此帮助"
        echo ""
        echo "快速启动 (无需任何外部服务):"
        echo "  cd $SCRIPT_DIR"
        echo "  bash start.sh standalone"
        echo ""
        echo "默认账号:"
        echo "  管理层: admin / admin123 (全局总览)"
        echo "  一线人员: staff / staff123 (主入口区,核心景区A)"
        echo "  一线人员: staff2 / staff123 (山顶观景区,湖滨休闲区)"
        ;;
esac
