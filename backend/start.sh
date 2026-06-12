#!/bin/bash

echo "=== 启动后端服务 ==="

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "安装依赖..."
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "复制环境变量配置..."
    cp .env.example .env
    echo "请编辑 .env 文件配置数据库连接信息
fi

echo "请确保 PostgreSQL 和 Redis 服务已启动
echo "启动 FastAPI 服务..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
