#!/bin/bash
cd "$(dirname "$0")"

echo "=== 安装后端依赖 ==="
pip3 install -r requirements.txt

echo ""
echo "=== 初始化 DuckDB 业务库（可重复执行，会重置旧数据）==="
python3 -m app.scripts.init_all_data

echo ""
echo "=== 启动后端服务（DuckDB-first 模式，端口 8002）==="
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
