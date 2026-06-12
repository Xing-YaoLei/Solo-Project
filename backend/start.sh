#!/bin/bash
# 连锁咖啡设备清洁风险监测系统 后端启动脚本
set -e

echo "========================================"
echo "  咖啡设备清洁风险监测系统 - 后端启动"
echo "========================================"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 1. 创建data目录
mkdir -p data
echo "[OK] data目录已准备"

# 2. 检查/创建虚拟环境
if [ ! -d "venv" ]; then
    echo "正在创建Python虚拟环境..."
    python3 -m venv venv
    echo "[OK] 虚拟环境创建完成"
fi

# 3. 激活虚拟环境
source venv/bin/activate

# 4. 检查依赖
python -c "import fastapi, uvicorn, sqlalchemy, duckdb, pandas, pydantic" 2>/dev/null || {
    echo "正在安装依赖包..."
    pip install --upgrade pip
    pip install -r requirements.txt
    echo "[OK] 依赖安装完成"
}

# 5. 初始化Mock数据
echo "正在初始化Mock数据..."
python -c "
import sys
sys.path.insert(0, '.')
from app.services.mock_data import generate_mock_data
result = generate_mock_data()
print(f'[OK] 初始化完成: {len(result[\"stores\"])}个门店, {len(result[\"equipments\"])}个设备, {len(result[\"fault_records\"])}条故障, {len(result[\"rectification_tasks\"])}个任务, {len(result[\"inspection_records\"])}条巡检')
" || echo "[WARN] 初始化Mock数据异常（不影响启动，首次访问时会自动初始化）"

# 6. 启动服务
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
echo ""
echo "启动服务于 http://$HOST:$PORT"
echo "API文档: http://$HOST:$PORT/docs"
echo "按 Ctrl+C 停止服务"
echo "========================================"

exec uvicorn main:app --host "$HOST" --port "$PORT" --reload
