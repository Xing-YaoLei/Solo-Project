#!/usr/bin/env bash
# 活动票务核销漏斗报表系统启动脚本

set -e

echo "=========================================="
echo "🎫 活动票务核销漏斗报表系统"
echo "=========================================="

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装 Python 3.9+"
    exit 1
fi

PYTHON=$(which python3)
PIP="$PYTHON -m pip"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "📦 创建虚拟环境..."
    $PYTHON -m venv .venv
fi

echo "🔧 激活虚拟环境..."
source .venv/bin/activate

# 安装依赖
echo "📥 安装依赖包..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

# 确保数据目录存在
mkdir -p data

# 环境变量配置
if [ ! -f ".env" ]; then
    echo "⚙️  创建默认 .env 配置..."
    cp .env.example .env
fi

# 端口配置
PORT=${1:-8501}

echo ""
echo "=========================================="
echo "🚀 启动 Streamlit 服务"
echo "📝 访问地址: http://localhost:$PORT"
echo "🧪 首次使用请在左侧边栏点击 '🎲 生成模拟数据'"
echo "⏹️  按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

streamlit run app.py \
    --server.port "$PORT" \
    --server.address 0.0.0.0 \
    --server.enableCORS true \
    --server.enableXsrfProtection false \
    --theme.base "light" \
    --theme.primaryColor "#6366F1"
