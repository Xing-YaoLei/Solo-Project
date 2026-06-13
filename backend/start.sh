#!/bin/bash
cd "$(dirname "$0")"

echo "=== 安装后端依赖 ==="
pip install -r requirements.txt

echo ""
echo "=== 初始化数据 ==="
python -c "
import sys
sys.path.insert(0, '.')
from app.db.database import Base, engine
from app.db.duckdb_conn import init_duckdb_tables
from app.services.sync_service import init_default_thresholds
import app.models

Base.metadata.create_all(bind=engine)
init_duckdb_tables()
init_default_thresholds()
print('数据库初始化完成')
"

echo ""
echo "=== 生成 Mock 数据 ==="
python -c "
import sys
sys.path.insert(0, '.')
from app.scripts.mock_data import generate_mock_data
generate_mock_data()
"

echo ""
echo "=== 启动后端服务 ==="
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
