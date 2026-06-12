#!/bin/bash

# 检查并自动设置执行权限
if [ ! -x "$0" ]; then
    echo "检测到脚本没有执行权限，正在自动设置..."
    chmod +x "$0" "$(dirname "$0")/start_celery.sh" "$(dirname "$0")/start_celery_beat.sh" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "请手动执行: chmod +x start.sh start_celery.sh start_celery_beat.sh"
        exit 1
    fi
    echo "执行权限已设置，正在重新启动..."
    exec "$0" "$@"
fi

echo "=== 启动后端服务 ==="

cd "$(dirname "$0")" || exit 1

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate || source venv/Scripts/activate

echo "安装依赖..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "复制环境变量配置..."
    cp .env.example .env
    echo "请编辑 .env 文件配置数据库连接信息"
fi

echo "请确保 PostgreSQL 和 Redis 服务已启动"
echo "启动 FastAPI 服务..."
echo "访问地址: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
