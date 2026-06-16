#!/bin/bash
set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📥 安装依赖..."
pip install -q -r requirements.txt

if [ -f ".env" ]; then
    echo "📄 已找到 .env 配置"
else
    echo "📄 未找到 .env，使用默认 PostgreSQL 配置"
    echo "   如需切换 SQLite，请创建 .env 并设置 DATABASE_URL=sqlite:///rehab_center.db"
fi

python -c "
import os, sys
sys.path.insert(0, '.')
from config.settings import settings
print(f'💾 当前数据库: {settings.DATABASE_URL}')
if 'sqlite' in settings.DATABASE_URL:
    db_file = settings.DATABASE_URL.split('///')[-1]
    if not os.path.exists(db_file):
        print('📦 首次运行，初始化 SQLite 数据库...')
        from database.db import init_db
        init_db()
        from scripts.mock_data_generator import generate_mock_data
        generate_mock_data()
    else:
        print('✅ SQLite 数据库已存在')
else:
    print('ℹ️  PostgreSQL 模式：请确保数据库服务已运行且 rehab_center 库已创建')
    try:
        from database.db import engine
        with engine.connect() as conn:
            conn.execute(__import__('sqlalchemy').text('SELECT 1'))
        print('✅ PostgreSQL 连接成功')
    except Exception as e:
        print(f'⚠️  PostgreSQL 连接失败: {e}')
        print('   提示：可设置 DATABASE_URL=sqlite:///rehab_center.db 切换到 SQLite 模式')
        exit 1
"

echo ""
echo "🚀 启动 Dash 应用..."
python run.py
