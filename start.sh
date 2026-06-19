#!/usr/bin/env bash
# =========================================================
# 景区运营门票预约排程台 - 项目一键启动脚本（macOS/Linux）
# =========================================================
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 项目根目录: $BASE_DIR"
echo ""

# ---------- 1. 检查环境 ----------
echo "🔍 检查运行环境..."

if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET SDK 未安装，请先安装 .NET 8.0 SDK"
    exit 1
fi
echo "   ✅ .NET SDK: $(dotnet --version)"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi
echo "   ✅ Node.js: $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "   ✅ npm: $(npm -v)"

echo ""

# ---------- 2. 还原后端依赖 ----------
echo "📦 还原后端依赖..."
cd "$BASE_DIR/backend"
dotnet restore ScenicTicketBooking.sln || true

echo ""

# ---------- 3. 还原前端依赖 ----------
echo "📦 安装前端依赖（首次运行会较慢）..."
cd "$BASE_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   node_modules 已存在，跳过（如需重新安装请删除 node_modules）"
fi

echo ""

# ---------- 4. 启动后端 ----------
echo "🚀 启动后端 API 服务 (端口 5000/5001)..."
cd "$BASE_DIR/backend/src/ScenicTicketBooking.Api"
dotnet run --no-launch-profile --urls "http://localhost:5000;https://localhost:5001" &
API_PID=$!
echo "   后端 PID: $API_PID"

# 等待后端启动
sleep 8
if ! kill -0 $API_PID 2>/dev/null; then
    echo "❌ 后端启动失败，请检查日志"
    exit 1
fi

echo "   ✅ 后端已启动"
echo "      📄 Swagger:    http://localhost:5000/swagger"
echo "      📄 Hangfire:   http://localhost:5000/hangfire"
echo "      🔌 API Base:   http://localhost:5000/api"

echo ""

# ---------- 5. 启动前端 ----------
echo "🚀 启动前端开发服务器 (端口 3000)..."
cd "$BASE_DIR/frontend"
npm run dev &
FE_PID=$!
echo "   前端 PID: $FE_PID"

sleep 6

echo ""
echo "============================================================"
echo "  🎉 景区运营门票预约排程台 - 全部服务已启动！"
echo "============================================================"
echo ""
echo "  🌐 前端首页:       http://localhost:3000"
echo "  📖 API 文档:       http://localhost:5000/swagger"
echo "  🕐 Hangfire 队列:  http://localhost:5000/hangfire"
echo ""
echo "  停止服务请按 Ctrl+C"
echo "============================================================"
echo ""

# 捕获 Ctrl+C 清理进程
trap "echo '🛑 正在停止服务...'; kill $API_PID $FE_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# 等待
wait
