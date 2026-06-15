#!/bin/bash
set -e

echo "=========================================="
echo "  职业教育学员社群跟进台 - 启动脚本"
echo "=========================================="

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo ""
echo "📁 项目目录: $PROJECT_ROOT"
echo ""

check_python() {
    if ! command -v python3 &> /dev/null; then
        echo "❌ 未找到 python3，请先安装 Python 3.10+"
        exit 1
    fi
    echo "✅ Python 版本: $(python3 --version)"
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo "❌ 未找到 node，请先安装 Node.js 18+"
        exit 1
    fi
    echo "✅ Node 版本: $(node --version)"
    echo "✅ npm 版本: $(npm --version)"
}

setup_backend() {
    echo ""
    echo "🔧 设置后端环境..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "venv" ]; then
        echo "  -> 创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    echo "  -> 安装依赖..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    
    if [ ! -f ".env" ]; then
        echo "  -> 复制环境变量文件..."
        cp .env.example .env
    fi
    
    echo "✅ 后端环境准备完成"
}

setup_frontend() {
    echo ""
    echo "🔧 设置前端环境..."
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo "  -> 安装 npm 依赖..."
        npm install --silent
    fi
    
    echo "✅ 前端环境准备完成"
}

init_db() {
    echo ""
    echo "🗄️  初始化数据库..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    if command -v psql &> /dev/null; then
        echo "  -> 检查 PostgreSQL 数据库..."
        DB_NAME="community_followup"
        if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            echo "  -> 创建数据库 $DB_NAME ..."
            createdb "$DB_NAME" 2>/dev/null || echo "  ⚠️  跳过自动创建数据库（请手动创建）"
        fi
    fi
    
    echo "  -> 运行种子数据..."
    python3 -m scripts.seed_data || echo "  ⚠️  请确保 PostgreSQL 已启动且数据库配置正确"
}

show_help() {
    echo ""
    echo "使用方法:"
    echo "  $0 setup      # 仅安装依赖和初始化（不启动服务）"
    echo "  $0 backend    # 仅启动后端服务"
    echo "  $0 frontend   # 仅启动前端服务"
    echo "  $0 celery     # 仅启动 Celery Worker"
    echo "  $0 init-db    # 仅初始化数据库和种子数据"
    echo "  $0 all        # 启动所有服务（后端+前端+Celery）"
    echo "  $0 dev        # 启动后端+前端（推荐开发模式）"
    echo "  $0 help       # 显示此帮助"
    echo ""
}

start_backend() {
    echo ""
    echo "🚀 启动后端服务 (FastAPI)..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
    echo "   📍 地址: http://localhost:8000"
    echo "   📍 文档: http://localhost:8000/docs"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

start_frontend() {
    echo ""
    echo "🚀 启动前端服务 (Vite)..."
    cd "$FRONTEND_DIR"
    echo "   📍 地址: http://localhost:3000"
    npm run dev
}

start_celery() {
    echo ""
    echo "🚀 启动 Celery Worker..."
    cd "$BACKEND_DIR"
    source venv/bin/activate
    celery -A app.celery_app.celery_app worker --loglevel=info -B
}

start_all() {
    echo ""
    echo "🚀 启动所有服务..."
    
    trap "kill 0" EXIT
    
    start_celery &
    sleep 2
    start_backend &
    sleep 3
    start_frontend &
    
    wait
}

start_dev() {
    echo ""
    echo "🚀 启动开发模式（后端+前端）..."
    
    trap "kill 0" EXIT
    
    (cd "$BACKEND_DIR" && source venv/bin/activate && uvicorn app.main:app --reload --port 8000) &
    BACKEND_PID=$!
    echo "   📍 后端: http://localhost:8000  (PID: $BACKEND_PID)"
    
    sleep 2
    
    (cd "$FRONTEND_DIR" && npm run dev) &
    FRONTEND_PID=$!
    echo "   📍 前端: http://localhost:3000  (PID: $FRONTEND_PID)"
    
    echo ""
    echo "✅ 开发服务已启动！按 Ctrl+C 停止所有服务"
    echo ""
    
    wait
}

# ========== 主流程 ==========

check_python
check_node

case "${1:-dev}" in
    setup)
        setup_backend
        setup_frontend
        init_db
        echo ""
        echo "🎉 初始化完成！运行 '$0 dev' 启动开发服务"
        ;;
    backend)
        setup_backend
        start_backend
        ;;
    frontend)
        setup_frontend
        start_frontend
        ;;
    celery)
        setup_backend
        start_celery
        ;;
    init-db)
        setup_backend
        init_db
        ;;
    all)
        setup_backend
        setup_frontend
        init_db
        start_all
        ;;
    dev)
        setup_backend
        setup_frontend
        init_db
        start_dev
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        show_help
        exit 1
        ;;
esac
