#!/bin/bash
set -e

echo "=== 健身私教课程消耗跟进系统 - 启动脚本 ==="

if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，正在复制 .env.example..."
    cp .env.example .env
    echo "✅ 已创建 .env，请根据实际情况修改数据库配置"
fi

echo ""
echo "📦 安装Python依赖..."
pip install -r requirements.txt

echo ""
echo "🗄️  初始化数据库..."
python scripts/init_db.py

echo ""
echo "🚀 启动FastAPI服务..."
echo "服务地址: http://localhost:8000"
echo "API文档:  http://localhost:8000/docs"
echo ""
exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
