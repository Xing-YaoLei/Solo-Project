#!/bin/bash

export PYTHONPATH=$(pwd)

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

pip install -r requirements.txt

python -c "
from app.init_db import init_db
init_db()
print('数据库初始化完成')
"

python -c "
from app.utils.sample_data import generate_sample_data
generate_sample_data()
print('示例数据生成完成')
"

echo ""
echo "============================================"
echo "票务漏斗分析系统 - 初始化完成"
echo "============================================"
echo ""
echo "启动方式："
echo "  方式一（推荐）：python run.py"
echo "  方式二：     python -m app.dashboard.app"
echo ""
echo "然后访问: http://localhost:8050"
echo ""
