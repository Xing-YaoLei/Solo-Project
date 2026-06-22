#!/usr/bin/env bash
set -e

echo "=============================================="
echo "  合规审计制度检查看板 - 启动脚本"
echo "=============================================="

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR"

if [ ! -d ".venv" ]; then
    echo "[1/4] 创建 Python 虚拟环境..."
    python3 -m venv .venv
else
    echo "[1/4] 虚拟环境已存在，跳过创建"
fi

source .venv/bin/activate

echo "[2/4] 安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "[3/4] 复制环境变量配置..."
    cp .env.example .env
    echo "请修改 .env 文件配置数据库和 Redis 连接信息"
else
    echo "[3/4] 环境配置已存在，跳过"
fi

echo ""
echo "=============================================="
echo "  环境准备完成！"
echo ""
echo "  启动步骤："
echo "  1. 确保 PostgreSQL 和 Redis 正在运行"
echo "  2. 初始化示例数据: source .venv/bin/activate && python scripts/seed_data.py"
echo "  3. 启动 Celery Worker: source .venv/bin/activate && celery -A app.celery_app.celery_app worker --loglevel=info"
echo "  4. 启动 Web 应用:    source .venv/bin/activate && python run.py"
echo ""
echo "  测试账号："
echo "  - 管理员:    admin / admin123"
echo "  - 管理层:    manager / manager123"
echo "  - 一线审计:  auditor1 / auditor123"
echo "  - 一线审计:  auditor2 / auditor123"
echo "  - 一线审计:  auditor3 / auditor123"
echo "=============================================="
