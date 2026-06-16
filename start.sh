#!/bin/bash

echo "=========================================="
echo "  药店连锁处方审核排程台 - 启动脚本"
echo "=========================================="

# 检查 dotnet 是否安装
if ! command -v dotnet &> /dev/null; then
    echo "❌ 未检测到 .NET SDK，请先安装 .NET 8.0 SDK"
    echo "下载地址: https://dotnet.microsoft.com/download"
    exit 1
fi

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

# 检查 SQL Server 连接
echo ""
echo "📋 请确保 SQL Server 已启动，并已配置好连接字符串"
echo "   连接字符串配置文件: src/PrescriptionReview.Api/appsettings.json"
echo ""

# 安装前端依赖
echo "📦 正在安装前端依赖..."
cd client
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

echo ""
echo "🚀 正在启动后端服务 (端口: 5000)..."
cd src/PrescriptionReview.Api
dotnet run --urls "http://localhost:5000" &
BACKEND_PID=$!
cd ../../

echo "⏳ 等待后端启动..."
sleep 10

echo ""
echo "🌐 正在启动前端服务 (端口: 3000)..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "  系统启动完成！"
echo "=========================================="
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端 API: http://localhost:5000"
echo "📊 Swagger文档: http://localhost:5000/swagger"
echo "⏰ Hangfire任务: http://localhost:5000/hangfire (admin/admin123)"
echo ""
echo "👤 测试账号:"
echo "   admin / 123456 (总部运营)"
echo "   manager001 / 123456 (店长)"
echo "   pharmacist001 / 123456 (药师)"
echo "   cashier001 / 123456 (收银员)"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '🛑 服务已停止'" EXIT

wait
