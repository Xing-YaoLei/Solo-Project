#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo " 启动活动票务赞助权益风险监测系统 - 后端 API"
echo "=============================================="

cd "$BACKEND_DIR"

REQUIRED_PACKAGES=("fastapi" "uvicorn" "duckdb" "pandas" "numpy" "pydantic" "sqlalchemy" "psycopg2-binary")

if [ ! -d "venv" ]; then
  echo "[1/4] 首次启动，创建 Python 虚拟环境..."
  python3 -m venv venv
fi

source venv/bin/activate

needs_install=false
for pkg in "${REQUIRED_PACKAGES[@]}"; do
  if ! venv/bin/pip list 2>/dev/null | grep -q "^${pkg} "; then
    echo "  检测到缺失包: $pkg"
    needs_install=true
    break
  fi
done

if $needs_install; then
  echo "[2/4] 安装 Python 依赖..."
  echo "  升级 pip..."
  pip install --upgrade pip setuptools wheel 2>&1 | tail -3

  echo "  安装 requirements.txt..."
  if ! pip install -r requirements.txt --no-cache-dir 2>&1; then
    echo "  批量安装失败，尝试逐个安装..."
    while IFS= read -r line || [ -n "$line" ]; do
      [[ -z "$line" || "$line" == \#* ]] && continue
      pkg=$(echo "$line" | cut -d'=' -f1 | xargs)
      echo "    安装 $pkg..."
      pip install --no-cache-dir "$line" 2>&1 | tail -2
    done < requirements.txt
  fi

  echo "  验证依赖安装..."
  all_ok=true
  for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if ! venv/bin/pip list 2>/dev/null | grep -q "^${pkg} "; then
      echo "    ❌ $pkg 未安装成功"
      all_ok=false
    fi
  done
  if $all_ok; then
    echo "  ✅ 所有依赖安装完成"
  else
    echo "  ⚠️  部分依赖未安装，但继续启动（可能部分功能不可用）"
  fi
else
  echo "[2/4] 依赖已就绪，跳过安装"
fi

echo "[3/4] 确保数据目录存在..."
mkdir -p logs data

echo "[4/4] 环境检测..."
if [ -n "$DATABASE_URL" ]; then
  echo "  ✅ PostgreSQL 已配置: DATABASE_URL=${DATABASE_URL%@*}@***"
  echo "     将启用 PostgreSQL + DuckDB 双写模式"
else
  echo "  ℹ️  未配置 DATABASE_URL，仅使用 DuckDB 模式"
fi

echo ""
echo "✅ 后端服务启动中..."
echo "📡 API 地址:  http://localhost:8000"
echo "📖 文档地址:  http://localhost:8000/docs"
echo "💾 DuckDB 文件: $BACKEND_DIR/data/analytics.duckdb"
echo ""
echo "Ctrl + C 停止服务"
echo ""

cd "$BACKEND_DIR"
exec uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
